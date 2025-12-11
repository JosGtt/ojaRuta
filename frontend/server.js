import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Configuración de seguridad básica
app.disable('x-powered-by');

// Servir archivos estáticos con configuración apropiada
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// Health check para Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// SPA fallback - todas las rutas devuelven index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor frontend corriendo en puerto ${PORT}`);
  console.log(`🌐 Sirviendo desde: ${path.join(__dirname, 'dist')}`);
  console.log(`📍 URL: http://0.0.0.0:${PORT}`);
});
