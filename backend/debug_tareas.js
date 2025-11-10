const pg = require('pg');

const client = new pg.Client({
  host: 'localhost',
  port: 5432,
  database: 'sedegesOjaRuta',
  user: 'postgres',
  password: '123456'
});

async function debugTareas() {
  try {
    await client.connect();
    console.log('🔍 Debugeando tareas para Gestión de Tareas...\n');
    
    // 1. Ver todas las hojas con sus días de vencimiento
    const hojas = await client.query(`
      SELECT 
        numero_hr,
        prioridad,
        estado_cumplimiento,
        dias_para_vencimiento,
        fecha_limite,
        CASE 
          WHEN dias_para_vencimiento IS NULL THEN 'NULL'
          WHEN dias_para_vencimiento <= 0 THEN 'VENCIDA'
          WHEN dias_para_vencimiento <= 3 THEN 'URGENTE'
          WHEN dias_para_vencimiento <= 7 THEN 'PRIORITARIO'
          ELSE 'RUTINARIO'
        END as clasificacion_por_dias
      FROM hojas_ruta 
      WHERE estado_cumplimiento != 'completado'
      ORDER BY dias_para_vencimiento ASC NULLS LAST;
    `);
    
    console.log('📋 Análisis de TODAS las hojas pendientes:');
    hojas.rows.forEach((hoja, index) => {
      console.log(`${index + 1}. ${hoja.numero_hr}`);
      console.log(`   Prioridad: ${hoja.prioridad || 'NULL'}`);
      console.log(`   Estado: ${hoja.estado_cumplimiento || 'NULL'}`);
      console.log(`   Días vencimiento: ${hoja.dias_para_vencimiento || 'NULL'}`);
      console.log(`   Clasificación: ${hoja.clasificacion_por_dias}`);
      console.log(`   Fecha límite: ${hoja.fecha_limite || 'NULL'}`);
      console.log('');
    });
    
    // 2. Contar por categorías
    const conteo = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (
          WHERE dias_para_vencimiento <= 0 OR 
                (dias_para_vencimiento IS NULL AND fecha_limite < CURRENT_DATE)
        ) as vencidas,
        COUNT(*) FILTER (
          WHERE dias_para_vencimiento > 0 AND dias_para_vencimiento <= 3
        ) as urgentes,
        COUNT(*) FILTER (
          WHERE dias_para_vencimiento > 3 AND dias_para_vencimiento <= 7
        ) as prioritarios,
        COUNT(*) FILTER (
          WHERE dias_para_vencimiento > 7
        ) as rutinarios_por_dias,
        COUNT(*) FILTER (
          WHERE dias_para_vencimiento IS NULL
        ) as sin_fecha_limite
      FROM hojas_ruta 
      WHERE estado_cumplimiento != 'completado';
    `);
    
    console.log('📊 CONTEO POR CATEGORÍAS:');
    console.log(`Total pendientes: ${conteo.rows[0].total}`);
    console.log(`Vencidas: ${conteo.rows[0].vencidas}`);
    console.log(`Urgentes (1-3 días): ${conteo.rows[0].urgentes}`);
    console.log(`Prioritarios (4-7 días): ${conteo.rows[0].prioritarios}`);
    console.log(`Rutinarios (>7 días): ${conteo.rows[0].rutinarios_por_dias}`);
    console.log(`Sin fecha límite: ${conteo.rows[0].sin_fecha_limite}`);
    
    // 3. Probar la consulta del dashboard
    console.log('\n🔍 Probando consulta del dashboard...');
    const dashboard = await client.query(`
      SELECT 
        numero_hr,
        prioridad,
        dias_para_vencimiento,
        estado_cumplimiento,
        fecha_limite
      FROM dashboard_hojas_recientes 
      WHERE estado_cumplimiento NOT IN ('completado', 'cancelado') 
        AND dias_para_vencimiento <= 10
      ORDER BY 
        CASE 
          WHEN dias_para_vencimiento < 0 THEN 1
          WHEN dias_para_vencimiento <= 3 THEN 2  
          WHEN dias_para_vencimiento <= 7 THEN 3
          ELSE 4
        END,
        dias_para_vencimiento ASC
      LIMIT 15;
    `);
    
    console.log('\n📊 RESULTADOS DE CONSULTA DASHBOARD:');
    dashboard.rows.forEach((hoja, index) => {
      const tipo = hoja.dias_para_vencimiento <= 0 ? 'urgente' : 
                   hoja.dias_para_vencimiento <= 3 ? 'urgente' : 
                   hoja.dias_para_vencimiento <= 7 ? 'prioritario' : 'rutinario';
      console.log(`${index + 1}. ${hoja.numero_hr} - ${tipo} (${hoja.dias_para_vencimiento} días)`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

debugTareas();