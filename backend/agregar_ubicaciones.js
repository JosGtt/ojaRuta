const pool = require('./dist/config/database.js').default;

async function agregarColumnas() {
  try {
    console.log('🔧 Agregando columnas de ubicación...');
    
    // Agregar ubicacion_actual
    try {
      await pool.query(`
        ALTER TABLE hojas_ruta 
        ADD COLUMN ubicacion_actual VARCHAR(100) DEFAULT 'Mesa de Partes'
      `);
      console.log('✅ Columna ubicacion_actual agregada');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ ubicacion_actual ya existe');
      } else {
        console.error('❌ Error ubicacion_actual:', error.message);
      }
    }
    
    // Agregar responsable_actual
    try {
      await pool.query(`
        ALTER TABLE hojas_ruta 
        ADD COLUMN responsable_actual VARCHAR(100) DEFAULT 'Área de Despacho'
      `);
      console.log('✅ Columna responsable_actual agregada');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ responsable_actual ya existe');
      } else {
        console.error('❌ Error responsable_actual:', error.message);
      }
    }
    
    // Verificar que se agregaron
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'hojas_ruta' 
        AND column_name IN ('ubicacion_actual', 'responsable_actual')
    `);
    
    console.log('✅ Columnas verificadas:', result.rows.map(r => r.column_name));
    
    // Actualizar registros existentes
    const updateResult = await pool.query(`
      UPDATE hojas_ruta 
      SET 
        ubicacion_actual = COALESCE(ubicacion_actual, 'Oficina de Trámites'),
        responsable_actual = COALESCE(responsable_actual, 'Jefe de Trámites')
      WHERE ubicacion_actual IS NULL OR responsable_actual IS NULL
    `);
    
    console.log('✅ Registros actualizados:', updateResult.rowCount);
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    process.exit();
  }
}

agregarColumnas();