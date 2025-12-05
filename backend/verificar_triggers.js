const pool = require('./dist/config/database.js').default;

async function verificarTriggers() {
  try {
    console.log('🔍 Verificando triggers en tabla envios...');
    
    // Verificar triggers en la tabla envios
    const triggersQuery = `
      SELECT 
        tgname as trigger_name, 
        tgenabled as enabled,
        pg_get_triggerdef(oid) as trigger_definition
      FROM pg_trigger 
      WHERE tgrelid = (SELECT oid FROM pg_class WHERE relname = 'envios')
    `;
    
    const result = await pool.query(triggersQuery);
    console.log('📋 Triggers encontrados en envios:', result.rows);
    
    // Verificar también triggers que puedan afectar hojas_ruta
    const hojasRutaTriggers = `
      SELECT 
        tgname as trigger_name, 
        tgenabled as enabled
      FROM pg_trigger 
      WHERE tgrelid = (SELECT oid FROM pg_class WHERE relname = 'hojas_ruta')
        AND tgname LIKE '%envio%' OR tgname LIKE '%ubicacion%'
    `;
    
    const hojasTriggers = await pool.query(hojasRutaTriggers);
    console.log('📋 Triggers relacionados en hojas_ruta:', hojasTriggers.rows);
    
    // Verificar estructura de hojas_ruta
    const columnasQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'hojas_ruta' 
        AND (column_name LIKE '%ubicacion%' OR column_name LIKE '%responsable%')
    `;
    
    const columnas = await pool.query(columnasQuery);
    console.log('📋 Columnas de ubicación en hojas_ruta:', columnas.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

verificarTriggers();