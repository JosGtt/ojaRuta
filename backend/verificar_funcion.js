const pool = require('./dist/config/database.js').default;

async function verificarFuncion() {
  try {
    console.log('🔍 Verificando función que causa error...');
    
    // Verificar la función problemática
    const funcionQuery = `
      SELECT pg_get_functiondef(oid) as function_definition 
      FROM pg_proc 
      WHERE proname = 'actualizar_estado_hoja_por_envio'
    `;
    
    const result = await pool.query(funcionQuery);
    
    if (result.rows.length > 0) {
      console.log('📋 Función encontrada:');
      console.log(result.rows[0].function_definition);
    } else {
      console.log('❌ Función no encontrada');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

verificarFuncion();