import { Router } from 'express';
import { 
  crearEnvio, 
  listarEnvios, 
  actualizarEstadoEnvio, 
  obtenerDestinos 
} from '../controllers/enviarController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /api/enviar - Registrar nuevo envío de documentos
router.post('/', authenticateToken, crearEnvio);

// GET /api/enviar - Listar todos los envíos
router.get('/', authenticateToken, listarEnvios);

// PUT /api/enviar/:id/estado - Actualizar estado de envío específico
router.put('/:id/estado', authenticateToken, actualizarEstadoEnvio);

// GET /api/enviar/destinos - Obtener destinos disponibles
router.get('/destinos', authenticateToken, obtenerDestinos);

export default router;
