import { Request, Response } from 'express';
import pool from '../config/database';

interface AuthRequest extends Request {
  userId?: number;
}

// POST /api/enviar - Crear nuevo envío con autenticación JWT
export const crearEnvio = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.userId;
    const { hoja_id, destinatario, comentarios, archivos } = req.body || {};

    console.log('📤 Creando envío:', { usuarioId, hoja_id, destinatario });

    // Validar campos requeridos
    if (!destinatario) {
      return res.status(400).json({ error: 'El campo destinatario es requerido' });
    }

    // Procesar archivos como JSON
    const archivosJson = archivos ? JSON.stringify(archivos) : '[]';

    // Insertar en tabla envios
    const insertQuery = `
      INSERT INTO envios (hoja_id, usuario_id, destinatario, archivos, comentarios, created_at)
      VALUES ($1, $2, $3, $4::jsonb, $5, now())
      RETURNING *;
    `;

    const values = [
      hoja_id || null, 
      usuarioId, 
      destinatario.trim(), 
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
        error: 'La tabla envios no existe. Ejecuta la migración 006_crear_tabla_envios.sql' 
      });
    }
    
    // Error de foreign key (hoja_id no existe)
    if (err.code === '23503') {
      return res.status(400).json({ 
        error: 'La hoja de ruta especificada no existe' 
      });
    }

    return res.status(500).json({ 
      error: 'Error interno del servidor al crear envío',
      detalle: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export default { crearEnvio };
