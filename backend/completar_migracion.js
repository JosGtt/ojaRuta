const pool = require('./dist/config/database.js').default;

async function completarMigracion() {
  try {
    console.log('🔧 Completando migración 002 - agregando ubicacion_actual...');
    
    // Agregar solo la columna que falta
    await pool.query(`
      ALTER TABLE hojas_ruta 
      ADD COLUMN ubicacion_actual VARCHAR(100) DEFAULT 'Oficina Central'
    `);
    
    console.log('✅ Columna ubicacion_actual agregada');
    
    // Crear el índice que también debería estar
    try {
      await pool.query(`
        CREATE INDEX idx_hojas_ruta_ubicacion ON hojas_ruta(ubicacion_actual)
      `);
      console.log('✅ Índice agregado');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ Índice ya existe');
      } else {
        console.error('❌ Error con índice:', error.message);
      }
    }
    
    // Actualizar registros según la migración 002
    const updateResult = await pool.query(`
      UPDATE hojas_ruta 
      SET ubicacion_actual = CASE 
        WHEN estado_cumplimiento = 'completado' THEN 'Archivo General'
        WHEN estado_cumplimiento = 'vencido' THEN 'Mesa de Partes'
        WHEN prioridad = 'urgente' THEN 'Despacho Director'
        WHEN prioridad = 'prioritario' THEN 'Secretaría General'
        ELSE 'Oficina de Trámites'
      END
      WHERE numero_hr LIKE 'HR-2025-%'
    `);
    
    console.log(`✅ ${updateResult.rowCount} hojas de ruta actualizadas con ubicaciones`);
    
    // Verificar que ahora sí funciona el trigger
    console.log('🔍 Verificando que el problema se solucionó...');
    const verificacion = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'hojas_ruta' 
        AND column_name IN ('ubicacion_actual', 'responsable_actual')
    `);
    
    console.log('✅ Columnas verificadas:', verificacion.rows.map(r => r.column_name));
    
    if (verificacion.rows.length === 2) {
      console.log('🎉 ¡Problema solucionado! Ahora el sistema de envíos debería funcionar.');
    }
    
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('ya existe')) {
      console.log('✅ La columna ya existe, verificando...');
      
      const verificacion = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'hojas_ruta' 
          AND column_name IN ('ubicacion_actual', 'responsable_actual')
      `);
      
      console.log('✅ Columnas encontradas:', verificacion.rows.map(r => r.column_name));
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    process.exit();
  }
}

completarMigracion();