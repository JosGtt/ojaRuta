import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }

    req.userId = decoded.userId;
    req.userRole = decoded.rol;
    next();
  });
};