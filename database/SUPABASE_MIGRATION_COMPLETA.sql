-- MIGRACIÓN COMPLETA PARA SUPABASE
-- Ejecutar este script completo en el SQL Editor de Supabase

-- =============================================
-- PASO 1: CREAR ESTRUCTURA BASE
-- =============================================

-- Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    cargo VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de destinos/departamentos
CREATE TABLE IF NOT EXISTS destinos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tipos de trámite
CREATE TABLE IF NOT EXISTS tipos_tramite (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla principal de hojas de ruta
CREATE TABLE IF NOT EXISTS hojas_ruta (
    id SERIAL PRIMARY KEY,
    numero_hr VARCHAR(50) UNIQUE NOT NULL,
    referencia TEXT NOT NULL,
    procedencia VARCHAR(200) NOT NULL,
    fecha_documento DATE,
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    cite VARCHAR(100),
    numero_fojas INTEGER,
    tipo_tramite_id INTEGER REFERENCES tipos_tramite(id),
    observaciones TEXT,
    ubicacion_fisica VARCHAR(200),
    estado_tramite VARCHAR(50) DEFAULT 'ACTIVO',
    usuario_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_limite DATE,
    estado VARCHAR(20) DEFAULT 'pendiente',
    nombre VARCHAR(200),
    telefono VARCHAR(20)
);

-- Tabla de movimientos/historial de las hojas de ruta
CREATE TABLE IF NOT EXISTS movimientos_hr (
    id SERIAL PRIMARY KEY,
    hoja_ruta_id INTEGER REFERENCES hojas_ruta(id) ON DELETE CASCADE,
    destino_anterior_id INTEGER REFERENCES destinos(id),
    destino_actual_id INTEGER REFERENCES destinos(id),
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    usuario_id INTEGER REFERENCES usuarios(id),
    tipo_movimiento VARCHAR(50) DEFAULT 'DERIVACION'
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'info',
    leida BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hoja_ruta_id INTEGER REFERENCES hojas_ruta(id) ON DELETE SET NULL
);

-- Tabla de envíos
CREATE TABLE IF NOT EXISTS envios (
    id SERIAL PRIMARY KEY,
    hoja_ruta_id INTEGER REFERENCES hojas_ruta(id) ON DELETE CASCADE,
    centro_acogida VARCHAR(200) NOT NULL,
    encargado_envio VARCHAR(200),
    telefono_contacto VARCHAR(20),
    direccion TEXT,
    observaciones TEXT,
    estado VARCHAR(50) DEFAULT 'pendiente',
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega TIMESTAMP,
    usuario_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de historial de cambios
CREATE TABLE IF NOT EXISTS historial_cambios (
    id SERIAL PRIMARY KEY,
    tabla_afectada VARCHAR(100) NOT NULL,
    registro_id INTEGER NOT NULL,
    campo_modificado VARCHAR(100),
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_operacion VARCHAR(20) NOT NULL,
    observaciones TEXT
);

-- =============================================
-- PASO 2: AGREGAR CAMPOS ADICIONALES
-- =============================================

-- Agregar campos de ubicación a hojas_ruta si no existen
ALTER TABLE hojas_ruta 
ADD COLUMN IF NOT EXISTS ubicacion_latitud DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS ubicacion_longitud DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS ubicacion_descripcion VARCHAR(255);

-- Agregar campo rol a usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'usuario' CHECK (rol IN ('desarrollador', 'admin', 'usuario'));

-- =============================================
-- PASO 3: CREAR ÍNDICES PARA MEJOR RENDIMIENTO
-- =============================================

CREATE INDEX IF NOT EXISTS idx_hojas_ruta_numero_hr ON hojas_ruta(numero_hr);
CREATE INDEX IF NOT EXISTS idx_hojas_ruta_estado ON hojas_ruta(estado);
CREATE INDEX IF NOT EXISTS idx_hojas_ruta_fecha_ingreso ON hojas_ruta(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_movimientos_hr_hoja_ruta_id ON movimientos_hr(hoja_ruta_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_hr_fecha ON movimientos_hr(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_id ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_envios_hoja_ruta_id ON envios(hoja_ruta_id);
CREATE INDEX IF NOT EXISTS idx_envios_estado ON envios(estado);

-- =============================================
-- PASO 4: CREAR USUARIOS INICIALES
-- =============================================

-- Usuario desarrollador (jose/jose)
INSERT INTO usuarios (username, password_hash, nombre_completo, email, cargo, rol, activo) 
VALUES (
    'jose',
    '$2b$10$YourHashedPasswordHere',  -- Se actualizará después
    'José Desarrollador',
    'jose@sedeges.gob.bo',
    'Desarrollador del Sistema',
    'desarrollador',
    true
) ON CONFLICT (username) DO NOTHING;

-- Usuario administrador (admin/2025)
INSERT INTO usuarios (username, password_hash, nombre_completo, email, cargo, rol, activo) 
VALUES (
    'admin',
    '$2b$10$YourHashedPasswordHere',  -- Se actualizará después
    'Administrador del Sistema',
    'admin@sedeges.gob.bo',
    'Administrador General',
    'admin',
    true
) ON CONFLICT (username) DO NOTHING;

-- Usuario normal (sedeges/2025)
INSERT INTO usuarios (username, password_hash, nombre_completo, email, cargo, rol, activo) 
VALUES (
    'sedeges',
    '$2b$10$YourHashedPasswordHere',  -- Se actualizará después
    'Usuario SEDEGES',
    'usuario@sedeges.gob.bo',
    'Funcionario',
    'usuario',
    true
) ON CONFLICT (username) DO NOTHING;

-- =============================================
-- PASO 5: CREAR DESTINOS INICIALES
-- =============================================

INSERT INTO destinos (nombre, descripcion, activo) VALUES
('DIRECCIÓN GENERAL', 'Dirección General de SEDEGES', true),
('UNIDAD LEGAL', 'Unidad Legal y Normativa', true),
('UNIDAD ADMINISTRATIVA', 'Unidad Administrativa y Financiera', true),
('UNIDAD TÉCNICA', 'Unidad Técnica y de Proyectos', true),
('RECEPCIÓN', 'Recepción de Documentos', true),
('ARCHIVO', 'Archivo General', true)
ON CONFLICT DO NOTHING;

-- =============================================
-- PASO 6: CREAR TIPOS DE TRÁMITE INICIALES
-- =============================================

INSERT INTO tipos_tramite (nombre, descripcion, activo) VALUES
('SOLICITUD', 'Solicitudes varias', true),
('INFORME', 'Informes técnicos y administrativos', true),
('CORRESPONDENCIA', 'Correspondencia oficial', true),
('RESOLUCIÓN', 'Resoluciones administrativas', true),
('MEMORÁNDUM', 'Memorándums internos', true),
('NOTA', 'Notas diversas', true)
ON CONFLICT DO NOTHING;

-- =============================================
-- FINAL: MENSAJE DE CONFIRMACIÓN
-- =============================================

-- Verificar que todo se haya creado correctamente
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('usuarios', 'hojas_ruta', 'destinos', 'tipos_tramite', 'movimientos_hr', 'notificaciones', 'envios', 'historial_cambios');
    
    IF table_count = 8 THEN
        RAISE NOTICE 'MIGRACIÓN COMPLETADA EXITOSAMENTE - % tablas creadas', table_count;
    ELSE
        RAISE NOTICE 'ADVERTENCIA - Solo % de 8 tablas fueron creadas', table_count;
    END IF;
END $$;