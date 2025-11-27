import { Request, Response } from 'express';
import pool from '../config/database';

interface AuthRequest extends Request {
  userId?: number;
}

// POST /api/enviar - Crear nuevo envío con estructura completa
export const crearEnvio = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.userId;
    const { 
      hoja_id, 
      destinatario_nombre, 
      destinatario_correo, 
      destinatario_numero, 
      destino_id,
      comentarios, 
      archivos,
      marcar_como_enviado = true // Por defecto marcar como enviado
    } = req.body || {};

    console.log('📤 Creando envío:', { 
      usuarioId, 
      hoja_id, 
      destinatario_nombre,
      destinatario_correo,
      destinatario_numero,
      destino_id,
      marcar_como_enviado
    });

    // Validar campos requeridos
    if (!destinatario_nombre) {
      return res.status(400).json({ error: 'El nombre del destinatario es requerido' });
    }

    // Procesar archivos como JSON
    const archivosJson = archivos ? JSON.stringify(archivos) : '[]';

    // Determinar estado inicial
    const estadoInicial = marcar_como_enviado ? 'enviado' : 'registrado';
    const fechaEnvio = marcar_como_enviado ? 'now()' : 'NULL';

    // Insertar en tabla envios con nueva estructura
    const insertQuery = `
      INSERT INTO envios (
        hoja_id, 
        usuario_id, 
        destinatario_nombre, 
        destinatario_correo, 
        destinatario_numero, 
        destino_id,
        archivos, 
        comentarios,
        estado,
        fecha_envio, 
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, ${fechaEnvio}, now())
      RETURNING *;
    `;

    const values = [
      hoja_id || null, 
      usuarioId, 
      destinatario_nombre.trim(), 
      destinatario_correo?.trim() || null,
      destinatario_numero?.trim() || null,
      destino_id || null,
      archivosJson, 
      comentarios?.trim() || null,
      estadoInicial
    ];

    const result = await pool.query(insertQuery, values);
    
    console.log('✅ Envío creado exitosamente:', result.rows[0]);

    // Si se marcó como enviado, obtener información del destino para el mensaje
    let mensajeExito = 'Envío registrado correctamente';
    if (marcar_como_enviado && destino_id) {
      try {
        const destinoQuery = 'SELECT nombre FROM destinos WHERE id = $1';
        const destinoResult = await pool.query(destinoQuery, [destino_id]);
        if (destinoResult.rows.length > 0) {
          mensajeExito = `Documento enviado exitosamente a: ${destinoResult.rows[0].nombre}`;
        }
      } catch (err) {
        console.warn('⚠️ No se pudo obtener nombre del destino:', err);
      }
    }

    return res.status(201).json({ 
      success: true, 
      envio: result.rows[0],
      mensaje: mensajeExito
    });

  } catch (err: any) {
    console.error('❌ Error al crear envío:', err);
    
    // Tabla envios no existe
    if (err.code === '42P01') {
      return res.status(501).json({ 
        error: 'La tabla envios no existe. Ejecuta la migración 007_reestructurar_tabla_envios.sql' 
      });
    }
    
    // Error de foreign key
    if (err.code === '23503') {
      if (err.detail?.includes('destino_id')) {
        return res.status(400).json({ 
          error: 'El destino especificado no existe' 
        });
      }
      if (err.detail?.includes('hoja_id')) {
        return res.status(400).json({ 
          error: 'La hoja de ruta especificada no existe' 
        });
      }
    }

    return res.status(500).json({ 
      error: 'Error interno del servidor al crear envío',
      detalle: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// GET /api/enviar - Listar envíos
export const listarEnvios = async (req: AuthRequest, res: Response) => {
  try {
    const query = `
      SELECT 
        e.*,
        hr.numero_hr,
        hr.referencia,
        d.nombre as destino_nombre,
        u.nombre_completo as usuario_nombre
      FROM envios e
      LEFT JOIN hojas_ruta hr ON e.hoja_id = hr.id
      LEFT JOIN destinos d ON e.destino_id = d.id
      LEFT JOIN usuarios u ON e.usuario_id = u.id
      ORDER BY e.created_at DESC
    `;

    const result = await pool.query(query);
    
    console.log('📋 Listando envíos:', result.rows.length);

    return res.status(200).json({ 
      success: true, 
      envios: result.rows
    });

  } catch (err: any) {
    console.error('❌ Error al listar envíos:', err);
    return res.status(500).json({ 
      error: 'Error interno del servidor al listar envíos',
      detalle: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// PUT /api/enviar/:id/estado - Actualizar estado de envío
export const actualizarEstadoEnvio = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { estado, fecha_entrega } = req.body;

    console.log('🔄 === INICIO ACTUALIZACIÓN ESTADO ===');
    console.log('🔄 Datos recibidos:', { id, estado, fecha_entrega });

    // Validar que el ID sea un número válido
    if (!id || isNaN(Number(id))) {
      console.log('❌ ID inválido:', id);
      return res.status(400).json({ error: 'ID de envío inválido' });
    }

    // Validar estado
    const estadosValidos = ['registrado', 'enviado', 'entregado', 'cancelado'];
    if (!estado || !estadosValidos.includes(estado)) {
      console.log('❌ Estado inválido:', estado);
      return res.status(400).json({ 
        error: 'Estado inválido. Debe ser: ' + estadosValidos.join(', ') 
      });
    }

    // Primero obtener el envío actual para debug
    const selectQuery = 'SELECT * FROM envios WHERE id = $1';
    const selectResult = await pool.query(selectQuery, [Number(id)]);
    
    if (selectResult.rows.length === 0) {
      console.log('❌ Envío no encontrado con ID:', id);
      return res.status(404).json({ error: 'Envío no encontrado' });
    }

    console.log('📋 Envío actual:', selectResult.rows[0]);

    // Construir la query de actualización simplificada
    let updateQuery: string;
    let values: any[];

    if (estado === 'enviado') {
      // Para estado enviado, también actualizar fecha_envio
      updateQuery = `UPDATE envios SET estado = $1, fecha_envio = COALESCE(fecha_envio, now()), updated_at = now() WHERE id = $2 RETURNING *`;
      values = [estado, Number(id)];
    } else if (estado === 'entregado' && fecha_entrega) {
      updateQuery = `UPDATE envios SET estado = $1, fecha_entrega = $2, updated_at = now() WHERE id = $3 RETURNING *`;
      values = [estado, fecha_entrega, Number(id)];
    } else {
      updateQuery = `UPDATE envios SET estado = $1, updated_at = now() WHERE id = $2 RETURNING *`;
      values = [estado, Number(id)];
    }

    console.log('📝 Query a ejecutar:', updateQuery);
    console.log('📝 Valores:', values);

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      console.log('❌ No se pudo actualizar, envío no encontrado');
      return res.status(404).json({ error: 'Envío no encontrado' });
    }

    console.log('✅ Estado actualizado exitosamente:', result.rows[0]);

    return res.status(200).json({ 
      success: true, 
      envio: result.rows[0],
      mensaje: `Envío marcado como ${estado}`
    });

  } catch (err: any) {
    console.error('❌ === ERROR COMPLETO ===');
    console.error('❌ Mensaje:', err.message);
    console.error('❌ Código:', err.code);
    console.error('❌ Detalle:', err.detail);
    console.error('❌ Stack:', err.stack);
    
    // Errores específicos de PostgreSQL
    if (err.code === '23503') {
      return res.status(400).json({ 
        error: 'Error de referencia: verifique que el envío y destino existan',
        detalle: err.detail
      });
    }

    if (err.code === '23514') {
      return res.status(400).json({ 
        error: 'Estado inválido según las restricciones de la base de datos',
        detalle: err.detail
      });
    }

    return res.status(500).json({ 
      error: 'Error interno del servidor al actualizar estado',
      detalle: err.message,
      codigo: err.code
    });
  }
};

// GET /api/enviar/destinos - Obtener destinos disponibles
export const obtenerDestinos = async (req: AuthRequest, res: Response) => {
  try {
    const query = `
      SELECT id, nombre, descripcion 
      FROM destinos 
      WHERE activo = true 
      ORDER BY nombre
    `;

    const result = await pool.query(query);
    
    console.log('📍 Obteniendo destinos:', result.rows.length);

    return res.status(200).json({ 
      success: true, 
      destinos: result.rows
    });

  } catch (err: any) {
    console.error('❌ Error al obtener destinos:', err);
    return res.status(500).json({ 
      error: 'Error interno del servidor al obtener destinos',
      detalle: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export default { 
  crearEnvio, 
  listarEnvios, 
  actualizarEstadoEnvio, 
  obtenerDestinos 
};
