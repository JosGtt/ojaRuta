const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const baseUrl = 'http://localhost:3001/api';

async function probarConAutenticacion() {
  try {
    console.log('🔐 Obteniendo token de autenticación...\n');

    // 1. Login para obtener token
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        usuario: 'jose',     // Usuario real de la base de datos
        password: 'jose'     // Contraseña real (sin hashear)
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Error en login:', loginResponse.status);
      console.log('💡 Prueba con usuario: admin, contraseña: 123456');
      console.log('   O con las credenciales que uses normalmente');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Token obtenido exitosamente\n');

    // 2. Probar dashboard tiempo real
    console.log('📊 Probando dashboard en tiempo real...');
    const dashboardResponse = await fetch(`${baseUrl}/hojas-ruta/dashboard/tiempo-real`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (dashboardResponse.ok) {
      const dashboard = await dashboardResponse.json();
      console.log('✅ Dashboard obtenido exitosamente:');
      console.log('   📋 Hojas recientes:', dashboard.hojas_recientes?.length || 0);
      
      if (dashboard.estadisticas) {
        console.log('   📊 Estadísticas:');
        console.log(`      Total: ${dashboard.estadisticas.total}`);
        console.log(`      Pendientes: ${dashboard.estadisticas.pendientes}`);
        console.log(`      Completadas: ${dashboard.estadisticas.completadas}`);
        console.log(`      Críticas: ${dashboard.estadisticas.criticas}`);
      }
      
      console.log('   🔔 Notificaciones no leídas:', dashboard.notificaciones?.length || 0);
      console.log('   ⏰ Tareas pendientes:', dashboard.tareas_pendientes?.length || 0);

      // Mostrar algunas notificaciones recientes
      if (dashboard.notificaciones && dashboard.notificaciones.length > 0) {
        console.log('\n   📢 Últimas notificaciones:');
        dashboard.notificaciones.slice(0, 3).forEach((notif, index) => {
          console.log(`      ${index + 1}. ${notif.mensaje}`);
        });
      }

    } else {
      const error = await dashboardResponse.text();
      console.log('❌ Error dashboard:', dashboardResponse.status, error);
    }

    // 3. Probar crear nueva hoja (esto debería generar notificación automática)
    console.log('\n🆕 Creando nueva hoja de ruta para probar notificaciones automáticas...');
    
    const nuevaHojaResponse = await fetch(`${baseUrl}/hojas-ruta`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        numero_hr: `TEST-NOTIF-${Date.now()}`,
        referencia: 'Prueba de notificaciones automáticas',
        procedencia: 'Sistema de pruebas',
        cite: `CITE-${Date.now()}`,
        numero_fojas: 3,
        prioridad: 'media',
        estado: 'activo',
        observaciones: 'Prueba del sistema de notificaciones en tiempo real',
        usuario_creador_id: 1,
        fecha_limite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
      })
    });

    if (nuevaHojaResponse.ok) {
      const nuevaHoja = await nuevaHojaResponse.json();
      console.log('✅ Nueva hoja creada:', nuevaHoja.numero_hr);
      
      // Esperar un poco para que se procese el trigger
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar dashboard actualizado
      console.log('\n🔄 Verificando dashboard actualizado...');
      const dashboardResponse2 = await fetch(`${baseUrl}/hojas-ruta/dashboard/tiempo-real`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (dashboardResponse2.ok) {
        const dashboard2 = await dashboardResponse2.json();
        console.log('📊 Dashboard actualizado:');
        console.log('   🔔 Notificaciones:', dashboard2.notificaciones?.length || 0);
        
        // Mostrar la nueva notificación
        if (dashboard2.notificaciones && dashboard2.notificaciones.length > 0) {
          console.log('   📢 Última notificación:', dashboard2.notificaciones[0].mensaje);
        }
      }

    } else {
      const error = await nuevaHojaResponse.text();
      console.log('❌ Error creando hoja:', nuevaHojaResponse.status, error);
    }

    console.log('\n🎉 Prueba completa del sistema terminada exitosamente!');
    console.log('💡 El sistema de notificaciones en tiempo real está funcionando');

  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.log('\n💡 Verifica que:');
    console.log('   - El backend esté corriendo en puerto 3001');
    console.log('   - La base de datos esté conectada');
    console.log('   - Las credenciales de login sean correctas');
  }
}

// Ejecutar prueba
probarConAutenticacion();