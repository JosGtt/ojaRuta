-- Schema completo para el Sistema de Hojas de Ruta SEDEGES La Paz
-- Base de datos: sedegesOjaRuta
-- PostgreSQL 9.6+

-- Crear base de datos (ejecutar como superusuario)
-- CREATE DATABASE "sedegesOjaRuta";

-- Conectar a la base de datos y ejecutar el siguiente script:

-- Tabla de usuarios del sistema
CREATE TABLE usuarios (
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
CREATE TABLE destinos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tipos de trámite
CREATE TABLE tipos_tramite (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla principal de hojas de ruta
CREATE TABLE hojas_ruta (
    id SERIAL PRIMARY KEY,
    numero_hr VARCHAR(50) UNIQUE NOT NULL,
    referencia TEXT NOT NULL,
    procedencia VARCHAR(200) NOT NULL,
    fecha_documento DATE,
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    cite VARCHAR(100),
    numero_fojas INTEGER,
    prioridad VARCHAR(20) CHECK (prioridad IN ('urgente', 'prioritario', 'rutinario', 'otros')),
    instrucciones_adicionales TEXT,
    usuario_creador_id INTEGER REFERENCES usuarios(id),
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'finalizada', 'cancelada')),
    detalles JSONB, -- Aquí se guardan todos los datos extra del formulario
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de seguimiento de hojas de ruta
CREATE TABLE seguimiento (
    id SERIAL PRIMARY KEY,
    hoja_ruta_id INTEGER REFERENCES hojas_ruta(id) ON DELETE CASCADE,
    destino_id INTEGER REFERENCES destinos(id),
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_recepcion TIMESTAMP,
    observaciones TEXT,
    usuario_responsable_id INTEGER REFERENCES usuarios(id),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'finalizado')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla intermedia para múltiples destinos por hoja de ruta
CREATE TABLE hoja_ruta_destinos (
    id SERIAL PRIMARY KEY,
    hoja_ruta_id INTEGER REFERENCES hojas_ruta(id) ON DELETE CASCADE,
    destino_id INTEGER REFERENCES destinos(id),
    instrucciones TEXT,
    orden INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX idx_hojas_ruta_numero_hr ON hojas_ruta(numero_hr);
CREATE INDEX idx_hojas_ruta_fecha_ingreso ON hojas_ruta(fecha_ingreso);
CREATE INDEX idx_hojas_ruta_usuario_creador ON hojas_ruta(usuario_creador_id);
CREATE INDEX idx_seguimiento_hoja_ruta_id ON seguimiento(hoja_ruta_id);
CREATE INDEX idx_hoja_ruta_destinos_hoja_ruta_id ON hoja_ruta_destinos(hoja_ruta_id);

-- Triggers para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hojas_ruta_updated_at BEFORE UPDATE ON hojas_ruta
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos iniciales
-- Usuario de prueba (contraseña: jose)
INSERT INTO usuarios (username, password_hash, nombre_completo, cargo) 
VALUES ('jose', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'José García', 'Administrador del Sistema');

-- Destinos comunes
INSERT INTO destinos (nombre) VALUES
('Dirección General'),
('Secretaría'),
('Departamento Legal'),
('Recursos Humanos'),
('Contabilidad'),
('Archivo Central'),
('Unidad de Sistemas'),
('Comunicación Social');

-- Tipos de trámite comunes
INSERT INTO tipos_tramite (nombre) VALUES
('Solicitud'),
('Informe'),
('Memorándum'),
('Carta'),
('Resolución'),
('Contrato'),
('Otros');

-- Ejemplo de hoja de ruta
INSERT INTO hojas_ruta (
    numero_hr, 
    referencia, 
    procedencia, 
    fecha_documento, 
    fecha_ingreso, 
    cite, 
    numero_fojas, 
    prioridad, 
    usuario_creador_id
) VALUES (
    'HR-2024-001',
    'Solicitud de información sobre programas sociales',
    'Alcaldía Municipal',
    '2024-01-15',
    '2024-01-16',
    'ALC-001/2024',
    5,
    'rutinario',
    1
);

-- Comentarios sobre el esquema
COMMENT ON TABLE usuarios IS 'Usuarios del sistema con acceso al manejo de hojas de ruta';
COMMENT ON TABLE destinos IS 'Departamentos, oficinas o destinos donde pueden dirigirse las hojas de ruta';
COMMENT ON TABLE tipos_tramite IS 'Clasificación de tipos de documentos o trámites';
COMMENT ON TABLE hojas_ruta IS 'Tabla principal que almacena las hojas de ruta del sistema';
COMMENT ON TABLE seguimiento IS 'Historial de movimiento y seguimiento de cada hoja de ruta';
COMMENT ON TABLE hoja_ruta_destinos IS 'Relación muchos a muchos entre hojas de ruta y destinos';

-- Función para generar número de HR automático
CREATE OR REPLACE FUNCTION generar_numero_hr() 
RETURNS TEXT AS $$
DECLARE
    nuevo_numero TEXT;
    contador INTEGER;
BEGIN
    -- Obtener el siguiente número secuencial del año actual
    SELECT COUNT(*) + 1 INTO contador 
    FROM hojas_ruta 
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Formatear como HR-YYYY-NNN
    nuevo_numero := 'HR-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(contador::TEXT, 3, '0');
    
    RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;