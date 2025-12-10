const bcrypt = require('bcryptjs');

async function generatePasswords() {
    const users = [
        { usuario: 'jose', password: 'jose', nombre: 'José Usuario', rol: 'usuario' },
        { usuario: 'admin', password: '2025', nombre: 'Administrador', rol: 'admin' },
        { usuario: 'sedeges', password: '2025', nombre: 'SEDEGES Admin', rol: 'desarrollador' }
    ];

    console.log('-- Insertar usuarios de prueba');
    
    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        console.log(`INSERT INTO usuarios (usuario, password, nombre_completo, rol, activo) VALUES ('${user.usuario}', '${hashedPassword}', '${user.nombre}', '${user.rol}', true);`);
    }
}

generatePasswords();