const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function probarAPIMejorada() {
  try {
    console.log('🔐 Obteniendo token...');
    
    // Login
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: 'jose', password: 'jose' })
    });

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Token obtenido\n');

    // Probar nuevo endpoint
    const dashboardResponse = await fetch('http://localhost:3001/api/hojas-ruta/dashboard/tiempo-real', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const dashboard = await dashboardResponse.json();
    
    console.log('📊 TAREAS PENDIENTES RECIBIDAS:');
    console.log(`Total tareas: ${dashboard.tareas_pendientes?.length || 0}`);
    
    if (dashboard.tareas_pendientes) {
      dashboard.tareas_pendientes.forEach((tarea, index) => {
        const tipo = tarea.dias_para_vencimiento <= 0 ? 'URGENTE' : 
                     tarea.dias_para_vencimiento <= 3 ? 'URGENTE' : 
                     tarea.dias_para_vencimiento <= 7 ? 'PRIORITARIO' : 'RUTINARIO';
        console.log(`${index + 1}. ${tarea.numero_hr} - ${tipo}`);
        console.log(`   Días: ${tarea.dias_para_vencimiento}, Prioridad: ${tarea.prioridad}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

probarAPIMejorada();