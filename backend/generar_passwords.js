const bcrypt = require('bcryptjs');

async function generarPasswords() {
  try {
    console.log('🔐 Generando contraseñas hasheadas...\n');
    
    // Contraseña: jose
    const passwordJose = await bcrypt.hash('jose', 10);
    console.log('Usuario: jose');
    console.log('Contraseña: jose');
    console.log('Hash:', passwordJose);
    console.log('');
    
    // Contraseña: 2025 para admin
    const passwordAdmin = await bcrypt.hash('2025', 10);
    console.log('Usuario: admin');
    console.log('Contraseña: 2025');
    console.log('Hash:', passwordAdmin);
    console.log('');
    
    // Contraseña: 2025 para sedeges
    const passwordSedeges = await bcrypt.hash('2025', 10);
    console.log('Usuario: sedeges');
    console.log('Contraseña: 2025');
    console.log('Hash:', passwordSedeges);
    console.log('');
    
    console.log('✅ Contraseñas generadas exitosamente!');
    console.log('');
    console.log('📋 Script SQL para insertar/actualizar usuarios:');
    console.log('');
    console.log(`-- Actualizar usuario jose como desarrollador`);
    console.log(`UPDATE usuarios SET password = '${passwordJose}', rol = 'desarrollador' WHERE usuario = 'jose';`);
    console.log('');
    console.log(`-- Insertar usuario admin`);
    console.log(`INSERT INTO usuarios (usuario, password, nombre_completo, email, rol) VALUES ('admin', '${passwordAdmin}', 'Administrador Sistema', 'admin@sedeges.com', 'admin') ON CONFLICT (usuario) DO UPDATE SET password = EXCLUDED.password, rol = EXCLUDED.rol;`);
    console.log('');
    console.log(`-- Insertar usuario sedeges`);
    console.log(`INSERT INTO usuarios (usuario, password, nombre_completo, email, rol) VALUES ('sedeges', '${passwordSedeges}', 'Usuario SEDEGES', 'usuario@sedeges.com', 'usuario') ON CONFLICT (usuario) DO UPDATE SET password = EXCLUDED.password, rol = EXCLUDED.rol;`);
    console.log('');
    console.log('-- Verificar usuarios creados');
    console.log('SELECT id, usuario, nombre_completo, rol, activo FROM usuarios ORDER BY id;');
    
  } catch (error) {
    console.error('❌ Error generando contraseñas:', error);
  }
}

generarPasswords();