import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
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

// Configuración básica
app.disable('x-powered-by');

// Middleware de logging simplificado
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Servir archivos estáticos
app.use(express.static(distPath, {
  maxAge: '1h',
  etag: true
}));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(indexPath);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
});
