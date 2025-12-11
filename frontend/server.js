import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4173;

// Servir archivos estáticos desde dist
app.use(express.static(join(__dirname, 'dist')));

// Todas las rutas devuelven index.html para SPA
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor frontend corriendo en puerto ${PORT}`);
  console.log(`🌐 http://0.0.0.0:${PORT}`);
});
