import { Router } from 'express';
import { listarDestinos } from '../controllers/destinosController';

const router = Router();

// Obtener todos los destinos (sin autenticación para dropdowns)
router.get('/', listarDestinos);

export default router;