import { Request, Response } from 'express';
import pool from '../config/database';

// Crear hoja de ruta
export const crearHojaRuta = async (req: Request, res: Response) => {
  try {
    const {
      numero_hr, referencia, procedencia, fecha_limite, cite, numero_fojas, prioridad, estado, observaciones, usuario_creador_id,
      // Todos los campos extra del formulario
      destino_principal, destinos, instrucciones_adicionales,
      fecha_recepcion_1, destino_1, destinos_1, instrucciones_adicionales_1,
      fecha_recepcion_2, destino_2, destinos_2, instrucciones_adicionales_2,
      fecha_recepcion_3, destino_3, destinos_3, instrucciones_adicionales_3
    } = req.body;

    // Guardar todos los datos extra en detalles (JSONB)
    const detalles = {
      destino_principal, destinos, instrucciones_adicionales,
      fecha_recepcion_1, destino_1, destinos_1, instrucciones_adicionales_1,
      fecha_recepcion_2, destino_2, destinos_2, instrucciones_adicionales_2,
      fecha_recepcion_3, destino_3, destinos_3, instrucciones_adicionales_3
    };

    const result = await pool.query(
      `INSERT INTO hojas_ruta (numero_hr, referencia, procedencia, fecha_limite, cite, numero_fojas, prioridad, estado, observaciones, usuario_creador_id, detalles, estado_cumplimiento)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [numero_hr, referencia, procedencia, fecha_limite, cite, numero_fojas, prioridad, estado, observaciones, usuario_creador_id, detalles, 'pendiente']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear hoja de ruta:', error);
    res.status(500).json({ error: 'Error al crear hoja de ruta' });
  }
};

// Listar/buscar hojas de ruta con filtros de estado
export const listarHojasRuta = async (req: Request, res: Response) => {
  try {
    const { query, estado_cumplimiento, incluir_completadas } = req.query;
    let sqlQuery = `
      SELECT *, 
             CASE 
               WHEN dias_para_vencimiento < 0 THEN 'Vencida'
               WHEN dias_para_vencimiento <= 3 THEN 'Crítica'
               WHEN dias_para_vencimiento <= 7 THEN 'Próxima a vencer'
               ELSE 'Normal'
             END as alerta_vencimiento
      FROM hojas_ruta 
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 0;

    // Filtro por búsqueda de texto
    if (query) {
      paramCount++;
      sqlQuery += ` AND (numero_hr ILIKE $${paramCount} OR referencia ILIKE $${paramCount})`;
      params.push(`%${query}%`);
    }

    // Filtro por estado de cumplimiento
    if (estado_cumplimiento) {
      paramCount++;
      sqlQuery += ` AND estado_cumplimiento = $${paramCount}`;
      params.push(estado_cumplimiento);
    }

    // Por defecto, no incluir las completadas a menos que se especifique
    if (incluir_completadas !== 'true') {
      sqlQuery += ` AND estado_cumplimiento != 'completado'`;
    }

    sqlQuery += ` ORDER BY 
      CASE WHEN estado_cumplimiento = 'vencido' THEN 1
           WHEN prioridad = 'urgente' THEN 2
           WHEN prioridad = 'prioritario' THEN 3
           ELSE 4 END,
      dias_para_vencimiento ASC NULLS LAST,
      fecha_ingreso DESC`;

    const result = await pool.query(sqlQuery, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al listar hojas de ruta:', error);
    res.status(500).json({ error: 'Error al listar hojas de ruta' });
  }
};

// Obtener detalle de hoja de ruta
export const obtenerHojaRuta = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM hojas_ruta WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hoja de ruta no encontrada' });
    }
    const hoja = result.rows[0];
    // Combinar los campos principales y los detalles (si existen)
    let fullData = { ...hoja };
    if (hoja.detalles) {
      try {
        // detalles ya es objeto si viene de pg
        fullData = { ...hoja, ...hoja.detalles };
      } catch {}
    }
    res.json(fullData);
  } catch (error) {
    console.error('Error al obtener hoja de ruta:', error);
    res.status(500).json({ error: 'Error al obtener hoja de ruta' });
  }
};

// Marcar hoja de ruta como completada
export const marcarCompletada = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE hojas_ruta 
       SET estado_cumplimiento = 'completado', 
           fecha_completado = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hoja de ruta no encontrada' });
    }

    // Crear notificación de completado
    const hoja = result.rows[0];
    await pool.query(
      `INSERT INTO notificaciones (hoja_ruta_id, usuario_id, tipo, mensaje)
       VALUES ($1, $2, 'completado', $3)`,
      [id, hoja.usuario_creador_id, `✅ Hoja de Ruta #${hoja.numero_hr} marcada como COMPLETADA`]
    );

    res.json({ message: 'Hoja de ruta marcada como completada', hoja: result.rows[0] });
  } catch (error) {
    console.error('Error al marcar como completada:', error);
    res.status(500).json({ error: 'Error al marcar como completada' });
  }
};

// Cambiar estado de cumplimiento
export const cambiarEstadoCumplimiento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado_cumplimiento } = req.body;
    
    if (!['pendiente', 'en_proceso', 'completado', 'vencido'].includes(estado_cumplimiento)) {
      return res.status(400).json({ error: 'Estado de cumplimiento inválido' });
    }

    const result = await pool.query(
      `UPDATE hojas_ruta 
       SET estado_cumplimiento = $1,
           fecha_completado = CASE WHEN $1 = 'completado' THEN CURRENT_TIMESTAMP ELSE NULL END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [estado_cumplimiento, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hoja de ruta no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};

// Obtener estadísticas del dashboard
export const obtenerEstadisticas = async (req: Request, res: Response) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE estado_cumplimiento = 'pendiente') as pendientes,
        COUNT(*) FILTER (WHERE estado_cumplimiento = 'en_proceso') as en_proceso,
        COUNT(*) FILTER (WHERE estado_cumplimiento = 'completado') as completadas,
        COUNT(*) FILTER (WHERE estado_cumplimiento = 'vencido') as vencidas,
        COUNT(*) FILTER (WHERE dias_para_vencimiento <= 3 AND estado_cumplimiento != 'completado') as criticas,
        COUNT(*) FILTER (WHERE dias_para_vencimiento <= 7 AND dias_para_vencimiento > 3 AND estado_cumplimiento != 'completado') as proximas_vencer
      FROM hojas_ruta
      WHERE estado != 'cancelada'
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// Obtener hojas por vencer (para dashboard)
export const obtenerHojasPorVencer = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT * FROM hojas_por_vencer 
      WHERE estado_cumplimiento != 'completado'
      ORDER BY dias_para_vencimiento ASC
      LIMIT 10
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener hojas por vencer:', error);
    res.status(500).json({ error: 'Error al obtener hojas por vencer' });
  }
};

// Cambiar ubicación de hoja de ruta
export const cambiarUbicacion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ubicacion_actual, responsable_actual } = req.body;

    const result = await pool.query(
      `UPDATE hojas_ruta 
       SET ubicacion_actual = $1, responsable_actual = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [ubicacion_actual, responsable_actual, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hoja de ruta no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al cambiar ubicación:', error);
    res.status(500).json({ error: 'Error al cambiar ubicación' });
  }
};

// Cambiar estado completo de hoja de ruta (nuevo)
export const cambiarEstadoCompleto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado_cumplimiento, estado_detalle } = req.body;

    // Usar la función de PostgreSQL que creamos
    const result = await pool.query(
      `SELECT cambiar_estado_hoja($1, $2, $3, $4) as resultado`,
      [id, estado_cumplimiento, estado_detalle, 1] // usuario_id = 1 por ahora
    );

    const resultado = result.rows[0].resultado;
    
    if (resultado.success) {
      // Obtener la hoja actualizada
      const hojaActualizada = await pool.query(
        'SELECT * FROM dashboard_hojas_recientes WHERE id = $1',
        [id]
      );
      
      res.json({
        success: true,
        mensaje: resultado.mensaje,
        hoja: hojaActualizada.rows[0]
      });
    } else {
      res.status(400).json(resultado);
    }
  } catch (error) {
    console.error('Error al cambiar estado completo:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};

// Obtener dashboard con datos en tiempo real (nuevo)
export const obtenerDashboardTiempoReal = async (req: Request, res: Response) => {
  try {
    // Hojas recientes (últimas 10)
    const hojasRecientes = await pool.query(`
      SELECT * FROM dashboard_hojas_recientes 
      WHERE estado_cumplimiento != 'completado'
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    // Estadísticas en tiempo real
    const estadisticas = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE estado_cumplimiento = 'pendiente') as pendientes,
        COUNT(*) FILTER (WHERE estado_cumplimiento = 'en_proceso') as en_proceso,
        COUNT(*) FILTER (WHERE estado_cumplimiento = 'completado') as completadas,
        COUNT(*) FILTER (WHERE estado_cumplimiento = 'vencido') as vencidas,
        COUNT(*) FILTER (WHERE estado_cumplimiento = 'cancelado') as canceladas,
        COUNT(*) FILTER (WHERE estado_cumplimiento = 'erroneo') as erroneas,
        COUNT(*) FILTER (WHERE dias_para_vencimiento <= 3 AND estado_cumplimiento NOT IN ('completado', 'cancelado')) as criticas
      FROM hojas_ruta
      WHERE estado != 'eliminado'
    `);

    // Notificaciones no leídas (últimas 10)
    const notificaciones = await pool.query(`
      SELECT * FROM notificaciones 
      WHERE leida = false
      ORDER BY fecha_creacion DESC 
      LIMIT 10
    `);

    // Tareas pendientes (MEJORADO para incluir rutinarios)
    const tareasPendientes = await pool.query(`
      SELECT 
        id,
        numero_hr,
        referencia,
        procedencia,
        prioridad,
        dias_para_vencimiento,
        fecha_limite,
        estado_cumplimiento,
        icono_estado
      FROM dashboard_hojas_recientes 
      WHERE estado_cumplimiento NOT IN ('completado', 'cancelado') 
        AND (dias_para_vencimiento <= 30 OR dias_para_vencimiento IS NULL)
      ORDER BY 
        CASE 
          WHEN dias_para_vencimiento < 0 THEN 1
          WHEN dias_para_vencimiento <= 3 THEN 2  
          WHEN dias_para_vencimiento <= 7 THEN 3
          WHEN dias_para_vencimiento <= 30 THEN 4
          ELSE 5
        END,
        dias_para_vencimiento ASC NULLS LAST
      LIMIT 20
    `);

    res.json({
      hojas_recientes: hojasRecientes.rows,
      estadisticas: estadisticas.rows[0],
      notificaciones: notificaciones.rows,
      tareas_pendientes: tareasPendientes.rows
    });

  } catch (error) {
    console.error('Error al obtener dashboard tiempo real:', error);
    res.status(500).json({ error: 'Error al obtener datos del dashboard' });
  }
};
