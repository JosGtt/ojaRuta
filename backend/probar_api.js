// Prueba completa de API endpoints del dashboard
const baseUrl = 'http://localhost:3001/api';

// Token de ejemplo (necesitarás uno real)
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTczMTI2MzQwMCwiZXhwIjoxNzMxMzQ5ODAwfQ.ejemplo';

async function probarEndpoints() {
  try {
    console.log('🚀 Probando endpoints del dashboard...\n');

    // 1. Obtener dashboard completo en tiempo real
    console.log('1. 📊 Probando /hojas-ruta/dashboard/tiempo-real');
    const response1 = await fetch(`${baseUrl}/hojas-ruta/dashboard/tiempo-real`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response1.ok) {
      const dashboard = await response1.json();
      console.log('   ✅ Dashboard obtenido exitosamente');
      console.log('   📋 Hojas recientes:', dashboard.hojas_recientes?.length || 0);
      console.log('   📊 Estadísticas:', dashboard.estadisticas ? 'OK' : 'Error');
      console.log('   🔔 Notificaciones:', dashboard.notificaciones?.length || 0);
      console.log('   ⏰ Tareas pendientes:', dashboard.tareas_pendientes?.length || 0);
    } else {
      console.log('   ❌ Error:', response1.status, response1.statusText);
      const error = await response1.text();
      console.log('   Detalle:', error);
    }

    // 2. Obtener estadísticas
    console.log('\n2. 📈 Probando /hojas-ruta/estadisticas/dashboard');
    const response2 = await fetch(`${baseUrl}/hojas-ruta/estadisticas/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response2.ok) {
      const stats = await response2.json();
      console.log('   ✅ Estadísticas obtenidas:');
      console.log('   📊 Total:', stats.total);
      console.log('   📋 Pendientes:', stats.pendientes);
      console.log('   🔄 En proceso:', stats.en_proceso);
      console.log('   ✅ Completadas:', stats.completadas);
      console.log('   🔴 Vencidas:', stats.vencidas);
      console.log('   ⚠️  Críticas:', stats.criticas);
    } else {
      console.log('   ❌ Error:', response2.status, response2.statusText);
    }

    // 3. Probar cambio de estado
    console.log('\n3. 🔄 Probando cambio de estado de una hoja...');
    
    // Primero obtener una hoja existente
    const response3 = await fetch(`${baseUrl}/hojas-ruta?limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response3.ok) {
      const hojas = await response3.json();
      if (hojas.length > 0) {
        const hojaId = hojas[0].id;
        console.log('   📋 Probando con hoja ID:', hojaId);
        
        // Cambiar estado
        const response4 = await fetch(`${baseUrl}/hojas-ruta/${hojaId}/estado-completo`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            estado_cumplimiento: 'en_proceso',
            estado_detalle: 'Prueba de cambio de estado desde API'
          })
        });

        if (response4.ok) {
          const resultado = await response4.json();
          console.log('   ✅ Estado cambiado exitosamente');
          console.log('   📝 Resultado:', resultado);
        } else {
          console.log('   ❌ Error al cambiar estado:', response4.status);
        }
      }
    }

    console.log('\n🎉 Prueba de endpoints completada');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    console.log('\n💡 Posibles causas:');
    console.log('   - Backend no está corriendo en puerto 3001');
    console.log('   - Token JWT inválido o expirado');
    console.log('   - Error de CORS');
    console.log('   - Error de conexión a la base de datos');
  }
}

// Ejecutar prueba
probarEndpoints();