
require('dotenv').config();
const pool = require('./dist/config/database.js').default;

async function verificarDatos() {
  try {
    console.log('🔍 Verificando datos en la base de datos...');
    
    // Verificar hojas de ruta
    const hojasResult = await pool.query('SELECT COUNT(*) FROM hojas_ruta');
    console.log('📋 Total hojas de ruta:', hojasResult.rows[0].count);
    
    // Verificar algunas hojas de ejemplo
    const ejemplosResult = await pool.query(`
      SELECT numero_hr, referencia, estado, created_at 
      FROM hojas_ruta 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log('📝 Últimas hojas de ruta:');
    ejemplosResult.rows.forEach(hoja => {
      console.log(`- ${hoja.numero_hr}: ${hoja.referencia.substring(0, 50)}... (${hoja.estado})`);
    });
    
    // Verificar destinos
    const destinosResult = await pool.query('SELECT COUNT(*) FROM destinos WHERE activo = true');
    console.log('📍 Total destinos activos:', destinosResult.rows[0].count);
    
    // Verificar usuarios
    const usuariosResult = await pool.query('SELECT COUNT(*) FROM usuarios WHERE activo = true');
    console.log('👤 Total usuarios activos:', usuariosResult.rows[0].count);
    
  } catch (error) {
    console.error('❌ Error conectando a BD:', error.message);
    console.log('🔧 Verifica que PostgreSQL esté corriendo y la configuración sea correcta');
  } finally {
    process.exit();
  }
}

verificarDatos();