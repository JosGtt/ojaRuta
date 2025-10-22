import { Router } from 'express';
import { login, verificarToken } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Ruta de login
router.post('/login', login);

// Ruta para verificar token
router.get('/verify', authenticateToken, verificarToken);

export default router;