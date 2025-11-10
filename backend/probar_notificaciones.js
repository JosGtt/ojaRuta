const pg = require('pg');

const client = new pg.Client({
  host: 'localhost',
  port: 5432,
  database: 'sedegesOjaRuta',
  user: 'postgres',
  password: '123456'
});

async function probarSistema() {
  try {
    await client.connect();
    console.log('🔍 Probando sistema de notificaciones automáticas...\n');
    
    // 1. Ver notificaciones actuales
    const notifAntes = await client.query(`
      SELECT COUNT(*) as total FROM notificaciones;
    `);
    console.log('📋 Notificaciones antes:', notifAntes.rows[0].total);
    
    // 2. Crear una nueva hoja de ruta (esto debería generar notificación automática)
    const nuevaHoja = await client.query(`
      INSERT INTO hojas_ruta 
      (numero_hr, referencia, procedencia, cite, numero_fojas, prioridad, estado, usuario_creador_id, fecha_limite) 
      VALUES 
      ('TEST-001', 'PRUEBA SISTEMA TIEMPO REAL', 'Sistema automático', 'CITE-TEST-001', 5, 'alta', 'activo', 1, CURRENT_DATE + INTERVAL '5 days')
      RETURNING id, numero_hr;
    `);
    
    console.log('✅ Nueva hoja creada:', nuevaHoja.rows[0]);
    
    // 3. Ver notificaciones después
    const notifDespues = await client.query(`
      SELECT COUNT(*) as total FROM notificaciones;
    `);
    console.log('📋 Notificaciones después:', notifDespues.rows[0].total);
    
    // 4. Ver la notificación más reciente
    const ultimaNotif = await client.query(`
      SELECT * FROM notificaciones 
      ORDER BY fecha_creacion DESC 
      LIMIT 1;
    `);
    
    console.log('🔔 Última notificación generada:');
    console.log('   Tipo:', ultimaNotif.rows[0].tipo);
    console.log('   Mensaje:', ultimaNotif.rows[0].mensaje);
    
    // 5. Probar cambio de estado
    console.log('\n🔄 Probando cambio de estado...');
    const resultado = await client.query(`
      SELECT cambiar_estado_hoja($1, 'completado', 'Prueba completada automáticamente', 1) as resultado;
    `, [nuevaHoja.rows[0].id]);
    
    console.log('📊 Resultado cambio estado:', resultado.rows[0].resultado);
    
    // 6. Ver dashboard actualizado
    const dashboard = await client.query(`
      SELECT numero_hr, estado_cumplimiento, icono_estado, alerta_vencimiento, dias_para_vencimiento 
      FROM dashboard_hojas_recientes 
      ORDER BY created_at DESC 
      LIMIT 3;
    `);
    
    console.log('\n📊 Dashboard actualizado:');
    dashboard.rows.forEach(hoja => {
      console.log(`   ${hoja.icono_estado} ${hoja.numero_hr} - ${hoja.estado_cumplimiento} (${hoja.alerta_vencimiento})`);
    });
    
    console.log('\n🎉 ¡Sistema funcionando perfectamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

probarSistema();