import { Router } from 'express';
import { crearHojaRuta, listarHojasRuta, obtenerHojaRuta } from '../controllers/hojasRutaController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Crear hoja de ruta
router.post('/', authenticateToken, crearHojaRuta);

// Listar/buscar hojas de ruta
router.get('/', authenticateToken, listarHojasRuta);

// Obtener detalle de hoja de ruta
router.get('/:id', authenticateToken, obtenerHojaRuta);

export default router;
