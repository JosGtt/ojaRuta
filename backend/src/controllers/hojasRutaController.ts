import { Request, Response } from 'express';
import pool from '../config/database';

// Crear hoja de ruta
export const crearHojaRuta = async (req: Request, res: Response) => {
  try {
    const {
      numero_hr, referencia, procedencia, fecha_documento, cite, numero_fojas, prioridad, estado, observaciones, usuario_creador_id,
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
      `INSERT INTO hojas_ruta (numero_hr, referencia, procedencia, fecha_documento, cite, numero_fojas, prioridad, estado, observaciones, usuario_creador_id, detalles)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [numero_hr, referencia, procedencia, fecha_documento, cite, numero_fojas, prioridad, estado, observaciones, usuario_creador_id, detalles]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear hoja de ruta:', error);
    res.status(500).json({ error: 'Error al crear hoja de ruta' });
  }
};

// Listar/buscar hojas de ruta
export const listarHojasRuta = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    let result;
    if (query) {
      result = await pool.query(
        `SELECT * FROM hojas_ruta WHERE numero_hr ILIKE $1 OR referencia ILIKE $1 ORDER BY fecha_ingreso DESC`,
        [`%${query}%`]
      );
    } else {
      result = await pool.query('SELECT * FROM hojas_ruta ORDER BY fecha_ingreso DESC');
    }
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
