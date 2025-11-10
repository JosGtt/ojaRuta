const pg = require('pg');

const client = new pg.Client({
  host: 'localhost',
  port: 5432,
  database: 'sedegesOjaRuta',
  user: 'postgres',
  password: '123456'
});

async function verificarEstructura() {
  try {
    await client.connect();
    console.log('🔍 Verificando estructura de la base de datos...\n');
    
    // 1. Verificar si existe tabla notificaciones
    const notificaciones = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notificaciones'
      );
    `);
    console.log('1. ✅ Tabla notificaciones existe:', notificaciones.rows[0].exists);
    
    // 2. Verificar columnas de hojas_ruta
    const columnas = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'hojas_ruta' 
      AND column_name IN ('estado_cumplimiento', 'fecha_limite', 'dias_para_vencimiento', 'fecha_completado', 'estado_detalle')
      ORDER BY column_name;
    `);
    console.log('2. 📋 Columnas nuevas en hojas_ruta:', columnas.rows.map(r => r.column_name));
    
    // 3. Verificar triggers
    const triggers = await client.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE event_object_table = 'hojas_ruta'
      ORDER BY trigger_name;
    `);
    console.log('3. ⚡ Triggers encontrados:', triggers.rows.map(r => r.trigger_name));
    
    // 4. Verificar funciones
    const funciones = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name IN ('calcular_dias_vencimiento', 'actualizar_estadisticas_dashboard', 'cambiar_estado_hoja')
      ORDER BY routine_name;
    `);
    console.log('4. 🔧 Funciones encontradas:', funciones.rows.map(r => r.routine_name));
    
    // 5. Contar hojas de ruta
    const hojas = await client.query(`SELECT COUNT(*) as total FROM hojas_ruta;`);
    console.log('5. 📊 Total hojas de ruta:', hojas.rows[0].total);
    
    // 6. Contar notificaciones
    if (notificaciones.rows[0].exists) {
      const notifs = await client.query(`SELECT COUNT(*) as total FROM notificaciones;`);
      console.log('6. 🔔 Total notificaciones:', notifs.rows[0].total);
    }
    
    // 7. Ver usuarios disponibles
    const usuarios = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios'
      ORDER BY ordinal_position;
    `);
    console.log('7. 📋 Columnas en tabla usuarios:', usuarios.rows.map(r => r.column_name));
    
    // Ver usuarios reales
    const usuariosReales = await client.query(`SELECT * FROM usuarios LIMIT 3;`);
    console.log('8. 👤 Usuarios en la base:');
    usuariosReales.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id}, Nombre: ${user.nombre_completo || 'N/A'}`);
    });
    
    console.log('\n🎉 Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('💡 Posibles causas:');
    console.error('   - El script de migración no se ejecutó');
    console.error('   - Error de conexión a la base de datos');
    console.error('   - La base de datos no existe');
  } finally {
    await client.end();
  }
}

verificarEstructura();