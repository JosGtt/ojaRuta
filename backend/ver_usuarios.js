const pg = require('pg');

const client = new pg.Client({
  host: 'localhost',
  port: 5432,
  database: 'sedegesOjaRuta',
  user: 'postgres',
  password: '123456'
});

async function verUsuarios() {
  try {
    await client.connect();
    console.log('👤 Consultando usuarios...\n');
    
    // Ver todos los usuarios
    const usuarios = await client.query(`
      SELECT id, usuario, nombre_completo, email, rol, activo, created_at 
      FROM usuarios 
      ORDER BY id;
    `);
    
    console.log('📋 Usuarios en la base de datos:');
    usuarios.rows.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Usuario: ${user.usuario || 'N/A'}`);
      console.log(`   Nombre: ${user.nombre_completo}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Rol: ${user.rol || 'N/A'}`);
      console.log(`   Activo: ${user.activo}`);
      console.log('');
    });
    
    if (usuarios.rows.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      console.log('💡 Necesitas crear un usuario primero');
    } else {
      console.log('💡 Para hacer login usa:');
      console.log(`   Usuario: ${usuarios.rows[0].usuario || 'Necesita configurarse'}`);
      console.log('   Contraseña: La que hayas configurado');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verUsuarios();