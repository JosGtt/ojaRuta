-- =============================================
-- ACTUALIZAR USUARIOS EN SUPABASE
-- Solo inserta/actualiza usuarios en la estructura existente
-- =============================================

-- PASO 1: Crear extensión para bcrypt (si no existe)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PASO 2: Insertar usuarios con contraseñas hasheadas correctamente
-- Usuario: jose / Contraseña: jose
INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol, activo) 
VALUES (
    'jose',
    crypt('jose', gen_salt('bf')),
    'José Desarrollador',
    'jose@sedeges.gob.bo',
    'desarrollador',
    true
) ON CONFLICT (username) DO UPDATE 
SET password_hash = crypt('jose', gen_salt('bf'));

-- Usuario: admin / Contraseña: admin
INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol, activo) 
VALUES (
    'admin',
    crypt('admin', gen_salt('bf')),
    'Administrador del Sistema',
    'admin@sedeges.gob.bo',
    'admin',
    true
) ON CONFLICT (username) DO UPDATE 
SET password_hash = crypt('admin', gen_salt('bf'));

-- Usuario: sedeges / Contraseña: sedeges
INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol, activo) 
VALUES (
    'sedeges',
    crypt('sedeges', gen_salt('bf')),
    'Usuario SEDEGES',
    'usuario@sedeges.gob.bo',
    'usuario',
    true
) ON CONFLICT (username) DO UPDATE 
SET password_hash = crypt('sedeges', gen_salt('bf'));

-- PASO 3: Verificación - Mostrar usuarios creados
SELECT id, username, nombre_completo, rol, activo 
FROM usuarios 
ORDER BY id;
