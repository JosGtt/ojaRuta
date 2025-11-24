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
      archivos 
    } = req.body || {};

    console.log('📤 Creando envío:', { 
      usuarioId, 
      hoja_id, 
      destinatario_nombre,
      destinatario_correo,
      destinatario_numero,
      destino_id
    });

    // Validar campos requeridos
    if (!destinatario_nombre) {
      return res.status(400).json({ error: 'El nombre del destinatario es requerido' });
    }

    // Procesar archivos como JSON
    const archivosJson = archivos ? JSON.stringify(archivos) : '[]';

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
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, now())
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
      comentarios?.trim() || null
    ];

    const result = await pool.query(insertQuery, values);
    
    console.log('✅ Envío creado exitosamente:', result.rows[0]);

    return res.status(201).json({ 
      success: true, 
      envio: result.rows[0],
      mensaje: 'Envío registrado correctamente'
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

    console.log('🔄 Actualizando estado de envío:', { id, estado, fecha_entrega });

    // Validar que el ID sea un número válido
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID de envío inválido' });
    }

    // Validar estado
    const estadosValidos = ['registrado', 'enviado', 'entregado', 'cancelado'];
    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({ 
        error: 'Estado inválido. Debe ser: ' + estadosValidos.join(', ') 
      });
    }

    // Construir la query de actualización
    let updateQuery = `UPDATE envios SET estado = $1, updated_at = now()`;
    let values = [estado];

    // Si se marca como entregado, actualizar fecha_entrega
    if (estado === 'entregado' && fecha_entrega) {
      updateQuery += `, fecha_entrega = $2`;
      values.push(fecha_entrega);
      updateQuery += ` WHERE id = $3 RETURNING *`;
      values.push(Number(id));
    } else {
      updateQuery += ` WHERE id = $2 RETURNING *`;
      values.push(Number(id));
    }

    console.log('📝 Query a ejecutar:', updateQuery);
    console.log('📝 Valores:', values);

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Envío no encontrado' });
    }

    console.log('✅ Estado de envío actualizado:', result.rows[0]);

    return res.status(200).json({ 
      success: true, 
      envio: result.rows[0],
      mensaje: `Envío marcado como ${estado}`
    });

  } catch (err: any) {
    console.error('❌ Error al actualizar estado de envío:', err);
    console.error('❌ Stack trace:', err.stack);
    
    // Errores específicos de PostgreSQL
    if (err.code === '23503') {
      return res.status(400).json({ 
        error: 'Error de referencia: verifique que el envío y destino existan' 
      });
    }

    if (err.code === '23514') {
      return res.status(400).json({ 
        error: 'Estado inválido según las restricciones de la base de datos' 
      });
    }

    return res.status(500).json({ 
      error: 'Error interno del servidor al actualizar estado',
      detalle: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
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
