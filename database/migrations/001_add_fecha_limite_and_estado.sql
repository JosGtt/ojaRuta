-- Migración para agregar funcionalidad de fechas límite y estados de cumplimiento
-- Fecha: 2025-11-06

-- 1. Agregar nuevos campos a la tabla hojas_ruta
ALTER TABLE hojas_ruta 
ADD COLUMN fecha_limite DATE,
ADD COLUMN estado_cumplimiento VARCHAR(20) DEFAULT 'pendiente' 
    CHECK (estado_cumplimiento IN ('pendiente', 'en_proceso', 'completado', 'vencido')),
ADD COLUMN dias_para_vencimiento INTEGER,
ADD COLUMN notificacion_enviada BOOLEAN DEFAULT false,
ADD COLUMN fecha_completado TIMESTAMP;

-- 2. Crear índices para mejorar performance en consultas
CREATE INDEX idx_hojas_ruta_fecha_limite ON hojas_ruta(fecha_limite);
CREATE INDEX idx_hojas_ruta_estado_cumplimiento ON hojas_ruta(estado_cumplimiento);
CREATE INDEX idx_hojas_ruta_dias_vencimiento ON hojas_ruta(dias_para_vencimiento);

-- 3. Crear función para calcular días hasta vencimiento
CREATE OR REPLACE FUNCTION calcular_dias_vencimiento()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular días hasta la fecha límite
    IF NEW.fecha_limite IS NOT NULL THEN
        NEW.dias_para_vencimiento := (NEW.fecha_limite - CURRENT_DATE);
        
        -- Auto-actualizar estado basado en días restantes
        IF NEW.estado_cumplimiento != 'completado' THEN
            IF NEW.dias_para_vencimiento < 0 THEN
                NEW.estado_cumplimiento := 'vencido';
            ELSIF NEW.dias_para_vencimiento <= 3 THEN
                NEW.prioridad := 'urgente';
            ELSIF NEW.dias_para_vencimiento <= 7 THEN
                NEW.prioridad := 'prioritario';
            END IF;
        END IF;
    END IF;
    
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger para actualizar automáticamente los días de vencimiento
CREATE TRIGGER trigger_calcular_dias_vencimiento
    BEFORE INSERT OR UPDATE ON hojas_ruta
    FOR EACH ROW
    EXECUTE PROCEDURE calcular_dias_vencimiento();

-- 5. Crear tabla para notificaciones del sistema
CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    hoja_ruta_id INTEGER REFERENCES hojas_ruta(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id),
    tipo VARCHAR(50) NOT NULL, -- 'fecha_limite', 'vencimiento', 'completado'
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_leida TIMESTAMP
);

-- 6. Crear índices para notificaciones
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX idx_notificaciones_fecha ON notificaciones(fecha_creacion);

-- 7. Función para generar notificaciones automáticas
CREATE OR REPLACE FUNCTION generar_notificacion_fecha_limite()
RETURNS TRIGGER AS $$
BEGIN
    -- Notificación cuando faltan 7 días
    IF NEW.dias_para_vencimiento = 7 AND (OLD.dias_para_vencimiento IS NULL OR OLD.dias_para_vencimiento != 7) THEN
        INSERT INTO notificaciones (hoja_ruta_id, usuario_id, tipo, mensaje)
        SELECT NEW.id, NEW.usuario_creador_id, 'fecha_limite',
               'La Hoja de Ruta #' || NEW.numero_hr || ' vence en 7 días (' || NEW.fecha_limite || ')';
    END IF;
    
    -- Notificación cuando faltan 3 días (urgente)
    IF NEW.dias_para_vencimiento = 3 AND (OLD.dias_para_vencimiento IS NULL OR OLD.dias_para_vencimiento != 3) THEN
        INSERT INTO notificaciones (hoja_ruta_id, usuario_id, tipo, mensaje)
        SELECT NEW.id, NEW.usuario_creador_id, 'fecha_limite',
               '¡URGENTE! La Hoja de Ruta #' || NEW.numero_hr || ' vence en 3 días (' || NEW.fecha_limite || ')';
    END IF;
    
    -- Notificación cuando se vence
    IF NEW.dias_para_vencimiento < 0 AND NEW.estado_cumplimiento = 'vencido' AND 
       (OLD.estado_cumplimiento IS NULL OR OLD.estado_cumplimiento != 'vencido') THEN
        INSERT INTO notificaciones (hoja_ruta_id, usuario_id, tipo, mensaje)
        SELECT NEW.id, NEW.usuario_creador_id, 'vencimiento',
               '⚠️ La Hoja de Ruta #' || NEW.numero_hr || ' ha VENCIDO (fecha límite: ' || NEW.fecha_limite || ')';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para generar notificaciones automáticas
CREATE TRIGGER trigger_generar_notificaciones
    AFTER UPDATE ON hojas_ruta
    FOR EACH ROW
    EXECUTE PROCEDURE generar_notificacion_fecha_limite();

-- 9. Vista para consultas rápidas de hojas por vencer
CREATE OR REPLACE VIEW hojas_por_vencer AS
SELECT 
    hr.*,
    CASE 
        WHEN hr.dias_para_vencimiento < 0 THEN 'Vencida'
        WHEN hr.dias_para_vencimiento <= 3 THEN 'Crítica'
        WHEN hr.dias_para_vencimiento <= 7 THEN 'Próxima a vencer'
        ELSE 'Normal'
    END as alerta_vencimiento
FROM hojas_ruta hr
WHERE hr.estado_cumplimiento != 'completado'
    AND hr.fecha_limite IS NOT NULL
ORDER BY hr.dias_para_vencimiento ASC;

-- 10. Función para marcar como completado
CREATE OR REPLACE FUNCTION marcar_completado(hoja_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE hojas_ruta 
    SET 
        estado_cumplimiento = 'completado',
        fecha_completado = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = hoja_id;
    
    -- Crear notificación de completado
    INSERT INTO notificaciones (hoja_ruta_id, usuario_id, tipo, mensaje)
    SELECT hoja_id, usuario_creador_id, 'completado',
           '✅ Hoja de Ruta #' || numero_hr || ' marcada como COMPLETADA'
    FROM hojas_ruta WHERE id = hoja_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 11. Actualizar hojas existentes (opcional - migrar datos)
-- Nota: Esto es opcional si quieres que las hojas existentes usen fecha_documento como fecha_limite
-- UPDATE hojas_ruta SET fecha_limite = fecha_documento WHERE fecha_documento IS NOT NULL;

COMMENT ON COLUMN hojas_ruta.fecha_limite IS 'Fecha máxima para dar cumplimiento a la hoja de ruta';
COMMENT ON COLUMN hojas_ruta.estado_cumplimiento IS 'Estado de cumplimiento: pendiente, en_proceso, completado, vencido';
COMMENT ON COLUMN hojas_ruta.dias_para_vencimiento IS 'Días restantes hasta la fecha límite (calculado automáticamente)';