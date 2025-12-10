import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import hojasRutaRoutes from './routes/hojasRuta';
import destinosRoutes from './routes/destinos';
import notificacionesRoutes from './routes/notificaciones';
import enviarRoutes from './routes/enviar';
import historialRoutes from './routes/historial';

// Cargar variables de entorno
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config();
}

console.log('🔧 Environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

// Middleware
const allowedOrigins: string[] = [
  'http://localhost:5173',
  'https://ojaruta-production-8e90.up.railway.app',
  process.env.CORS_ORIGIN || ''
].filter(origin => origin !== '');

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/hojas-ruta', hojasRutaRoutes);
app.use('/api/destinos', destinosRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/enviar', enviarRoutes);
app.use('/api/historial', historialRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Sistema de Hoja de Ruta API funcionando correctamente',
    timestamp: new Date().toISOString(),
    database: process.env.DB_HOST ? 'Connected' : 'Not configured'
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: 'API SEDEGES Hoja de Ruta', 
    version: '1.0.0',
    status: 'Running'
  });
});

// Manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Base de datos: ${process.env.DB_HOST || 'No configurada'}`);
  console.log(`🌐 CORS habilitado para: ${process.env.CORS_ORIGIN || 'localhost'}`);
});