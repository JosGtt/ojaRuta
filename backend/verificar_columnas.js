const pool = require('./dist/config/database.js').default;

async function verificarColumnas() {
  try {
    console.log('🔍 Verificando columnas en hojas_ruta...');
    
    const columnasQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'hojas_ruta' 
      ORDER BY column_name
    `;
    
    const result = await pool.query(columnasQuery);
    console.log('📋 Columnas en hojas_ruta:');
    result.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });
    
    // Verificar específicamente las columnas problemáticas
    const ubicacionExists = result.rows.some(col => col.column_name === 'ubicacion_actual');
    const responsableExists = result.rows.some(col => col.column_name === 'responsable_actual');
    
    console.log(`\n📍 ubicacion_actual existe: ${ubicacionExists}`);
    console.log(`📍 responsable_actual existe: ${responsableExists}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

verificarColumnas();