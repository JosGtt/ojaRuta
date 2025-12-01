-- ============================================
-- MIGRACIÓN 015: SISTEMA DE ROLES Y NUEVOS USUARIOS
-- ============================================
-- Fecha: 01/12/2025
-- Descripción: Agregar nuevos usuarios con roles específicos

BEGIN;

-- ============================================
-- 1. ACTUALIZAR USUARIO JOSE A DESARROLLADOR
-- ============================================
UPDATE usuarios 
SET rol = 'desarrollador',
    password = '$2b$10$f22Sbn1tzQP/or/aOD9Ie.gGaSAJ6FLzWunWxeCNJLJmXYpaMJC3K'
WHERE usuario = 'jose';

-- ============================================
-- 2. CREAR USUARIO ADMIN (admin/2025)
-- ============================================
-- Contraseña hasheada para "2025": $2b$10$TZtymZgRFeGzcIKLKOnMA.9J4gv4XzcHPyUMI/uG0w8QQp4q5tFxG
INSERT INTO usuarios (usuario, password, nombre_completo, email, rol) VALUES 
('admin', '$2b$10$TZtymZgRFeGzcIKLKOnMA.9J4gv4XzcHPyUMI/uG0w8QQp4q5tFxG', 'Administrador del Sistema', 'admin@sedeges.gob.bo', 'admin')
ON CONFLICT (usuario) DO UPDATE SET
    password = EXCLUDED.password,
    nombre_completo = EXCLUDED.nombre_completo,
    email = EXCLUDED.email,
    rol = EXCLUDED.rol;

-- ============================================
-- 3. CREAR USUARIO SEDEGES (sedeges/2025)  
-- ============================================
-- Contraseña hasheada para "2025": $2b$10$grAL6.pa3ZAYr/lUxmpRnuEHwAyRVXb.5r50g3.fDuFDTyUq5uo/S
INSERT INTO usuarios (usuario, password, nombre_completo, email, rol) VALUES 
('sedeges', '$2b$10$grAL6.pa3ZAYr/lUxmpRnuEHwAyRVXb.5r50g3.fDuFDTyUq5uo/S', 'Usuario SEDEGES', 'usuario@sedeges.gob.bo', 'usuario')
ON CONFLICT (usuario) DO UPDATE SET
    password = EXCLUDED.password,
    nombre_completo = EXCLUDED.nombre_completo,
    email = EXCLUDED.email,
    rol = EXCLUDED.rol;

-- ============================================
-- 4. VERIFICAR USUARIOS CREADOS
-- ============================================
SELECT 
    usuario, 
    nombre_completo, 
    rol, 
    email,
    activo,
    created_at
FROM usuarios 
ORDER BY 
    CASE 
        WHEN rol = 'desarrollador' THEN 1
        WHEN rol = 'admin' THEN 2
        WHEN rol = 'usuario' THEN 3
        ELSE 4
    END,
    created_at;

COMMIT;

-- ============================================
-- INFORMACIÓN DE ACCESO
-- ============================================
/*
USUARIOS CREADOS:

1. DESARROLLADOR (Acceso Total)
   - Usuario: jose
   - Contraseña: jose
   - Rol: desarrollador
   - Permisos: Crear, Ver, Editar, Eliminar

2. ADMINISTRADOR (Acceso Total)  
   - Usuario: admin
   - Contraseña: 2025
   - Rol: admin
   - Permisos: Crear, Ver, Editar, Eliminar

3. USUARIO (Solo Lectura/Creación)
   - Usuario: sedeges
   - Contraseña: 2025
   - Rol: usuario
   - Permisos: Crear, Ver (NO puede editar)
*/