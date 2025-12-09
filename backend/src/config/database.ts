import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuración para Supabase
// Usar DATABASE_URL si está disponible, sino usar variables individuales
const pool = process.env.DATABASE_URL 
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_PORT === '6543' ? { rejectUnauthorized: false } : false,
      // Configuración adicional para el pooler de Supabase
      ...(process.env.DB_PORT === '6543' && {
        options: '-c search_path=public'
      })
    });

// Probar conexión
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error de conexión a PostgreSQL:', err);
});

export default pool;