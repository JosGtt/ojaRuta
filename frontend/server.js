import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

// Verificar que dist existe
if (!existsSync(distPath)) {
  console.error('❌ ERROR: El directorio dist no existe');
  process.exit(1);
}

if (!existsSync(indexPath)) {
  console.error('❌ ERROR: index.html no existe en dist');
  process.exit(1);
}

console.log('✅ Directorio dist encontrado:', distPath);
console.log('✅ index.html encontrado:', indexPath);

// Configuración de seguridad básica
app.disable('x-powered-by');

// Trust proxy para Railway
app.set('trust proxy', 1);

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Health check para Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Servir archivos estáticos con configuración apropiada
app.use(express.static(distPath, {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  index: false // Desactivar index automático
}));

// SPA fallback - todas las rutas devuelven index.html
app.get('*', (req, res) => {
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error al servir index.html:', err);
      res.status(500).send('Error al cargar la aplicación');
    }
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error del servidor:', err);
  res.status(500).send('Error interno del servidor');
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor frontend corriendo en puerto ${PORT}`);
  console.log(`🌐 Sirviendo desde: ${distPath}`);
  console.log(`📍 URL: http://0.0.0.0:${PORT}`);
  console.log(`💚 Health check disponible en: http://0.0.0.0:${PORT}/health`);
});

// Manejo de señales para shutdown graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});
