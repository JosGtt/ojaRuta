import { Request, Response } from 'express';
import pool from '../config/database';

export const listarDestinos = async (req: Request, res: Response) => {
  try {
    console.log('Intentando obtener destinos...');
    
    const query = `
      SELECT id, nombre, descripcion 
      FROM destinos 
      WHERE activo = true
      ORDER BY nombre
    `;
    
    console.log('Ejecutando query:', query);
    const result = await pool.query(query);
    console.log('Resultado de la query:', result.rows);
    
    // Organizamos los destinos por categoría (basándonos en palabras clave en el nombre)
    const destinosOrganizados: { [key: string]: Array<{id: number, nombre: string, descripcion: string}> } = {
      'Centros de Acogida': [],
      'Direcciones Administrativas': [],
      'Otros': []
    };
    
    result.rows.forEach((row: any) => {
      const destino = {
        id: row.id,
        nombre: row.nombre,
        descripcion: row.descripcion
      };
      
      const nombre = row.nombre.toLowerCase();
      if (nombre.includes('centro') || nombre.includes('instituto')) {
        destinosOrganizados['Centros de Acogida'].push(destino);
      } else if (nombre.includes('dirección') || nombre.includes('departamento') || 
                 nombre.includes('secretaría') || nombre.includes('unidad') || 
                 nombre.includes('jefatura') || nombre.includes('subdirección')) {
        destinosOrganizados['Direcciones Administrativas'].push(destino);
      } else {
        destinosOrganizados['Otros'].push(destino);
      }
    });
    
    console.log('Destinos organizados:', destinosOrganizados);
    
    res.json({
      success: true,
      destinos: destinosOrganizados
    });
  } catch (error) {
    console.error('Error detallado al obtener destinos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la lista de destinos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};