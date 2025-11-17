import { Router } from 'express';
import { crearEnvio } from '../controllers/enviarController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /api/enviar - Registrar nuevo envío de documentos
router.post('/', authenticateToken, crearEnvio);

// GET /api/enviar - Listar envíos del usuario (futuro)
// router.get('/', authenticateToken, listarEnvios);

// GET /api/enviar/:id - Obtener detalle de envío (futuro)
// router.get('/:id', authenticateToken, obtenerEnvio);

export default router;
