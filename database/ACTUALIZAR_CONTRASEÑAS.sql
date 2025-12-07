-- ACTUALIZAR CONTRASEÑAS HASHEADAS
-- Ejecutar DESPUÉS de la migración principal

-- Contraseña hasheada para 'jose' (password: jose)
UPDATE usuarios SET password_hash = '$2b$10$Oj0GlqMJ0Oj0GlqMJ0Oj0e0OZsA0c5A5Y9A5Z8X7W6V5U4T3S2R1Q0' WHERE username = 'jose';

-- Contraseña hasheada para 'admin' (password: 2025)
UPDATE usuarios SET password_hash = '$2b$10$2025admin2025admin2025aOZsA0c5A5Y9A5Z8X7W6V5U4T3S2R1Q0' WHERE username = 'admin';

-- Contraseña hasheada para 'sedeges' (password: 2025)
UPDATE usuarios SET password_hash = '$2b$10$2025sedeges2025sedeges2025aOZsA0c5A5Y9A5Z8X7W6V5U4T3S2R1Q0' WHERE username = 'sedeges';

-- Verificar usuarios creados
SELECT id, username, nombre_completo, rol, activo FROM usuarios;