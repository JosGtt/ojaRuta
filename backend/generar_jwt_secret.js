// Script para generar JWT Secret seguro para producción
const crypto = require('crypto');

const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('🔐 JWT Secret para producción:');
console.log(jwtSecret);
console.log('\n📋 Copia este valor para la variable JWT_SECRET en Railway');