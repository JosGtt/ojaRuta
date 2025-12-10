import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { LoginRequest, LoginResponse } from '../types';

export const login = async (req: Request, res: Response) => {
  try {
    const { usuario, password }: LoginRequest = req.body;

    console.log('🔐 Intento de login:', { usuario, passwordLength: password?.length });

    // Validar datos
    if (!usuario || !password) {
      console.log('❌ Datos faltantes');
      return res.status(400).json({
        error: 'Usuario y contraseña son requeridos'
      });
    }

    console.log('🔍 Buscando usuario en BD:', usuario);

    // Buscar usuario en la base de datos
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE username = $1 AND activo = true',
      [usuario]
    );

    console.log('📊 Resultado query:', { rowsFound: result.rows.length });

    if (result.rows.length === 0) {
      console.log('❌ Usuario no encontrado:', usuario);
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    const user = result.rows[0];
    console.log('👤 Usuario encontrado:', { id: user.id, username: user.username, rol: user.rol });

    // Verificar contraseña
    const isValidPassword = await bcryptjs.compare(password, user.password_hash);
    
    console.log('🔑 Verificación de contraseña:', { isValid: isValidPassword });

    if (!isValidPassword) {
      console.log('❌ Contraseña incorrecta para:', usuario);
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const jwtSecret = process.env.JWT_SECRET || 'default-secret';
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        usuario: user.username,
        rol: user.rol 
      },
      jwtSecret
    );

    const response: LoginResponse = {
      token,
      usuario: {
        id: user.id,
        username: user.username,
        nombre_completo: user.nombre_completo,
        rol: user.rol
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

export const verificarToken = async (req: Request, res: Response) => {
  try {
    // El middleware ya verificó el token, solo devolvemos la info del usuario
    const userId = (req as any).userId;
    
    const result = await pool.query(
      'SELECT id, username, nombre_completo, rol FROM usuarios WHERE id = $1 AND activo = true',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      usuario: result.rows[0]
    });

  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};