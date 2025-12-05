const pool = require('./dist/config/database.js').default;
const fs = require('fs');

async function ejecutarMigracion() {
  try {
    console.log('🔧 Ejecutando migración para agregar columnas de ubicación...');
    
    // Leer el archivo SQL
    const sqlContent = fs.readFileSync('./fix_ubicaciones.sql', 'utf8');
    
    // Dividir en queries individuales (eliminar comentarios y espacios)
    const queries = sqlContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'))
      .filter(q => q.toLowerCase() !== 'commit');
    
    console.log(`📝 Ejecutando ${queries.length} queries...`);
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      console.log(`\n${i + 1}. Ejecutando: ${query.substring(0, 100)}...`);
      
      try {
        const result = await pool.query(query);
        
        if (result.rows && result.rows.length > 0) {
          console.log('✅ Resultado:', result.rows);
        } else {
          console.log('✅ Ejecutado correctamente');
        }
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('ya existe')) {
          console.log('⚠️ Ya existe, continuando...');
        } else {
          console.error('❌ Error en query:', error.message);
        }
      }
    }
    
    // Verificar el resultado final
    console.log('\n🔍 Verificando columnas agregadas...');
    const verificar = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'hojas_ruta' 
        AND column_name IN ('ubicacion_actual', 'responsable_actual')
    `);
    
    console.log('✅ Columnas encontradas:', verificar.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

ejecutarMigracion();