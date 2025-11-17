-- Migración 007: Crear tabla de historial de actividades
-- Fecha: 17/11/2024

-- Tabla para registrar todas las actividades del sistema
CREATE TABLE historial_actividades (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('añadido', 'editado', 'enviado', 'eliminado', 'estado_cambio')),
    hoja_id INTEGER REFERENCES hojas_ruta(id) ON DELETE SET NULL,
    numero_hr VARCHAR(50),
    referencia TEXT,
    procedencia TEXT,
    destinatario TEXT, -- Para envíos
    descripcion TEXT, -- Descripción detallada del cambio
    usuario_id INTEGER, -- ID del usuario (cuando tengamos auth completo)
    usuario_nombre VARCHAR(100), -- Nombre del usuario
    datos_anteriores JSONB, -- Estado anterior (para ediciones)
    datos_nuevos JSONB, -- Estado nuevo (para ediciones)
    fecha_actividad TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX idx_historial_tipo ON historial_actividades(tipo);
CREATE INDEX idx_historial_fecha ON historial_actividades(fecha_actividad DESC);
CREATE INDEX idx_historial_hoja_id ON historial_actividades(hoja_id);
CREATE INDEX idx_historial_usuario ON historial_actividades(usuario_nombre);

-- Trigger para actualizar historial cuando se crea una hoja de ruta
CREATE OR REPLACE FUNCTION trigger_historial_nueva_hoja()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO historial_actividades (
        tipo, hoja_id, numero_hr, referencia, procedencia, 
        descripcion, usuario_nombre, datos_nuevos
    ) VALUES (
        'añadido', 
        NEW.id, 
        NEW.numero_hr, 
        NEW.referencia, 
        NEW.procedencia,
        CONCAT('Nueva hoja de ruta creada: ', NEW.numero_hr),
        'Sistema', -- Cambiar cuando tengamos auth
        to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER historial_nueva_hoja
    AFTER INSERT ON hojas_ruta
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_historial_nueva_hoja();

-- Trigger para actualizar historial cuando se edita una hoja de ruta
CREATE OR REPLACE FUNCTION trigger_historial_edicion_hoja()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO historial_actividades (
        tipo, hoja_id, numero_hr, referencia, procedencia, 
        descripcion, usuario_nombre, datos_anteriores, datos_nuevos
    ) VALUES (
        'editado', 
        NEW.id, 
        NEW.numero_hr, 
        NEW.referencia, 
        NEW.procedencia,
        CONCAT('Hoja de ruta modificada: ', NEW.numero_hr),
        'Sistema', -- Cambiar cuando tengamos auth
        to_jsonb(OLD),
        to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER historial_edicion_hoja
    AFTER UPDATE ON hojas_ruta
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_historial_edicion_hoja();

-- Trigger para registrar envíos en historial
CREATE OR REPLACE FUNCTION trigger_historial_envio()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO historial_actividades (
        tipo, hoja_id, numero_hr, destinatario, 
        descripcion, usuario_nombre, datos_nuevos
    ) VALUES (
        'enviado', 
        NEW.hoja_id, 
        (SELECT numero_hr FROM hojas_ruta WHERE id = NEW.hoja_id),
        NEW.destinatario,
        CONCAT('Documento enviado a: ', NEW.destinatario),
        'Sistema', -- Cambiar cuando tengamos auth
        to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER historial_envio
    AFTER INSERT ON envios
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_historial_envio();

COMMENT ON TABLE historial_actividades IS 'Registro completo de todas las actividades del sistema';