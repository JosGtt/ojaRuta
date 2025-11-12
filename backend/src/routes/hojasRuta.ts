import { Router } from 'express';
import { 
  crearHojaRuta, 
  listarHojasRuta, 
  obtenerHojaRuta,
  marcarCompletada,
  cambiarEstadoCumplimiento,
  obtenerEstadisticas,
  obtenerHojasPorVencer,
  cambiarUbicacion,
  cambiarEstadoCompleto,
  obtenerDashboardTiempoReal,
  actualizarEstadoHojaRuta
} from '../controllers/hojasRutaController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Crear hoja de ruta
router.post('/', authenticateToken, crearHojaRuta);

// Listar/buscar hojas de ruta
router.get('/', authenticateToken, listarHojasRuta);

// Obtener estadísticas para dashboard
router.get('/estadisticas/dashboard', authenticateToken, obtenerEstadisticas);

// Obtener dashboard completo en tiempo real
router.get('/dashboard/tiempo-real', authenticateToken, obtenerDashboardTiempoReal);

// Obtener hojas por vencer
router.get('/por-vencer/lista', authenticateToken, obtenerHojasPorVencer);

// Obtener detalle de hoja de ruta
router.get('/:id', authenticateToken, obtenerHojaRuta);

// Marcar hoja como completada
router.patch('/:id/completar', authenticateToken, marcarCompletada);

// Cambiar estado de cumplimiento
router.patch('/:id/estado', authenticateToken, cambiarEstadoCumplimiento);

// Cambiar estado completo (nuevo)
router.patch('/:id/estado-completo', authenticateToken, cambiarEstadoCompleto);

// Actualizar estado de hoja de ruta (seguimiento mejorado)
router.put('/:id/estado', authenticateToken, actualizarEstadoHojaRuta);

// Cambiar ubicación de hoja de ruta
router.patch('/:id/ubicacion', authenticateToken, cambiarUbicacion);

export default router;
