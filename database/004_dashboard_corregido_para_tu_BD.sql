-- ================================================================
-- ACTUALIZACIÓN BD PARA DASHBOARD TIEMPO REAL - CORREGIDO PARA TU ESTRUCTURA
-- COMPATIBLE CON POSTGRESQL 9.6
-- ================================================================

-- ================================================================
-- PASO 1: CREAR TABLA DE NOTIFICACIONES (NO EXISTE EN TU BD)
-- ================================================================

CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    mensaje TEXT NOT NULL,
    hoja_ruta_id INTEGER REFERENCES hojas_ruta(id),
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leida BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- PASO 2: AGREGAR COLUMNAS FALTANTES A HOJAS_RUTA
-- ================================================================

-- Agregar columnas que necesita el sistema de dashboard
DO $$
BEGIN
    -- Agregar estado_cumplimiento si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'hojas_ruta' AND column_name = 'estado_cumplimiento') THEN
        ALTER TABLE hojas_ruta ADD COLUMN estado_cumplimiento VARCHAR(20) DEFAULT 'pendiente';
    END IF;
    
    -- Agregar fecha_limite si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'hojas_ruta' AND column_name = 'fecha_limite') THEN
        ALTER TABLE hojas_ruta ADD COLUMN fecha_limite DATE;
    END IF;
    
    -- Agregar dias_para_vencimiento si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'hojas_ruta' AND column_name = 'dias_para_vencimiento') THEN
        ALTER TABLE hojas_ruta ADD COLUMN dias_para_vencimiento INTEGER;
    END IF;
    
    -- Agregar fecha_completado si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'hojas_ruta' AND column_name = 'fecha_completado') THEN
        ALTER TABLE hojas_ruta ADD COLUMN fecha_completado TIMESTAMP;
    END IF;
    
    -- Agregar estado_detalle si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'hojas_ruta' AND column_name = 'estado_detalle') THEN
        ALTER TABLE hojas_ruta ADD COLUMN estado_detalle TEXT DEFAULT 'En trámite';
    END IF;
    
    -- Agregar campo detalles JSONB si no existe (para formulario completo)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'hojas_ruta' AND column_name = 'detalles') THEN
        ALTER TABLE hojas_ruta ADD COLUMN detalles TEXT; -- TEXT en lugar de JSONB para PG 9.6
    END IF;
    
END $$;

-- ================================================================
-- PASO 3: CREAR FUNCIÓN PARA CALCULAR DÍAS DE VENCIMIENTO
-- ================================================================

CREATE OR REPLACE FUNCTION calcular_dias_vencimiento()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular días para vencimiento
    IF NEW.fecha_limite IS NOT NULL THEN
        NEW.dias_para_vencimiento := NEW.fecha_limite - CURRENT_DATE;
    ELSE
        NEW.dias_para_vencimiento := NULL;
    END IF;
    
    -- Actualizar estado_cumplimiento automáticamente según días
    IF NEW.fecha_limite IS NOT NULL AND NEW.estado_cumplimiento != 'completado' THEN
        IF NEW.dias_para_vencimiento < 0 THEN
            NEW.estado_cumplimiento := 'vencido';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PASO 4: FUNCIÓN PARA NOTIFICACIONES AUTOMÁTICAS
-- ================================================================

CREATE OR REPLACE FUNCTION actualizar_estadisticas_dashboard()
RETURNS TRIGGER AS $$
DECLARE
    nueva_notificacion TEXT;
BEGIN
    -- Si es INSERT (nueva hoja de ruta)
    IF TG_OP = 'INSERT' THEN
        -- Crear notificación automática
        INSERT INTO notificaciones (
            tipo, 
            mensaje, 
            hoja_ruta_id, 
            usuario_id, 
            fecha_creacion, 
            leida
        ) VALUES (
            'nueva_hoja',
            'Nueva hoja de ruta creada: ' || NEW.numero_hr || ' - ' || LEFT(NEW.referencia, 50),
            NEW.id,
            NEW.usuario_creador_id,
            CURRENT_TIMESTAMP,
            false
        );
        
        RETURN NEW;
    END IF;

    -- Si es UPDATE (modificación de hoja)
    IF TG_OP = 'UPDATE' THEN
        -- Si cambió el estado de cumplimiento
        IF OLD.estado_cumplimiento != NEW.estado_cumplimiento THEN
            
            -- Determinar mensaje según el nuevo estado
            CASE NEW.estado_cumplimiento
                WHEN 'completado' THEN
                    nueva_notificacion := '✅ Hoja ' || NEW.numero_hr || ' ha sido marcada como completada';
                WHEN 'cancelado' THEN
                    nueva_notificacion := '❌ Hoja ' || NEW.numero_hr || ' ha sido cancelada';
                WHEN 'erroneo' THEN
                    nueva_notificacion := '⚠️ Hoja ' || NEW.numero_hr || ' marcada como errónea - revisar';
                WHEN 'en_proceso' THEN
                    nueva_notificacion := '🔄 Hoja ' || NEW.numero_hr || ' está en proceso';
                WHEN 'vencido' THEN
                    nueva_notificacion := '🔴 Hoja ' || NEW.numero_hr || ' ha vencido';
                ELSE
                    nueva_notificacion := '📋 Estado de hoja ' || NEW.numero_hr || ' actualizado';
            END CASE;

            -- Insertar notificación
            INSERT INTO notificaciones (
                tipo, 
                mensaje, 
                hoja_ruta_id, 
                usuario_id, 
                fecha_creacion, 
                leida
            ) VALUES (
                'cambio_estado',
                nueva_notificacion,
                NEW.id,
                NEW.usuario_creador_id,
                CURRENT_TIMESTAMP,
                false
            );
        END IF;
        
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PASO 5: CREAR TRIGGERS (POSTGRESQL 9.6 COMPATIBLE)
-- ================================================================

-- Eliminar triggers existentes si los hay
DROP TRIGGER IF EXISTS trigger_calcular_dias ON hojas_ruta;
DROP TRIGGER IF EXISTS trigger_nueva_hoja ON hojas_ruta;
DROP TRIGGER IF EXISTS trigger_cambio_estado ON hojas_ruta;

-- Trigger para calcular días de vencimiento (INSERT y UPDATE)
CREATE TRIGGER trigger_calcular_dias
    BEFORE INSERT OR UPDATE ON hojas_ruta
    FOR EACH ROW
    EXECUTE PROCEDURE calcular_dias_vencimiento();

-- Trigger para notificaciones (INSERT)
CREATE TRIGGER trigger_nueva_hoja
    AFTER INSERT ON hojas_ruta
    FOR EACH ROW
    EXECUTE PROCEDURE actualizar_estadisticas_dashboard();

-- Trigger para notificaciones (UPDATE)
CREATE TRIGGER trigger_cambio_estado
    AFTER UPDATE ON hojas_ruta
    FOR EACH ROW
    EXECUTE PROCEDURE actualizar_estadisticas_dashboard();

-- ================================================================
-- PASO 6: CREAR ÍNDICES PARA RENDIMIENTO
-- ================================================================

-- Índices para notificaciones
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notificaciones_usuario_fecha') THEN
        CREATE INDEX idx_notificaciones_usuario_fecha 
        ON notificaciones(usuario_id, fecha_creacion DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notificaciones_no_leidas') THEN
        CREATE INDEX idx_notificaciones_no_leidas 
        ON notificaciones(leida, fecha_creacion DESC) WHERE leida = false;
    END IF;
    
    -- Índices para hojas de ruta
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_hojas_estado_cumplimiento') THEN
        CREATE INDEX idx_hojas_estado_cumplimiento ON hojas_ruta(estado_cumplimiento);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_hojas_fecha_limite') THEN
        CREATE INDEX idx_hojas_fecha_limite ON hojas_ruta(fecha_limite);
    END IF;
END $$;

-- ================================================================
-- PASO 7: CREAR VISTA PARA DASHBOARD (CORREGIDA PARA TU ESTRUCTURA)
-- ================================================================

-- Vista que combina hojas recientes con estadísticas
CREATE OR REPLACE VIEW dashboard_hojas_recientes AS
SELECT 
    hr.*,
    CASE 
        WHEN hr.dias_para_vencimiento < 0 THEN 'Vencida'
        WHEN hr.dias_para_vencimiento <= 3 THEN 'Crítica'
        WHEN hr.dias_para_vencimiento <= 7 THEN 'Próxima a vencer'
        ELSE 'Normal'
    END as alerta_vencimiento,
    
    -- Información adicional para el dashboard
    CASE 
        WHEN hr.estado_cumplimiento = 'completado' THEN '✅'
        WHEN hr.estado_cumplimiento = 'cancelado' THEN '❌'
        WHEN hr.estado_cumplimiento = 'erroneo' THEN '⚠️'
        WHEN hr.estado_cumplimiento = 'vencido' THEN '🔴'
        WHEN hr.estado_cumplimiento = 'en_proceso' THEN '🔄'
        ELSE '📋'
    END as icono_estado,
    
    u.nombre_completo as creador_nombre  -- CORREGIDO: era u.nombre
FROM hojas_ruta hr
LEFT JOIN usuarios u ON hr.usuario_creador_id = u.id
WHERE hr.estado != 'eliminado'
ORDER BY hr.created_at DESC;

-- ================================================================
-- PASO 8: FUNCIÓN PARA CAMBIAR ESTADO DE HOJA (POSTGRESQL 9.6)
-- ================================================================

CREATE OR REPLACE FUNCTION cambiar_estado_hoja(
    p_hoja_id INTEGER,
    p_nuevo_estado VARCHAR(20),
    p_estado_detalle TEXT DEFAULT NULL,
    p_usuario_id INTEGER DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    hoja_numero VARCHAR(50);
    resultado TEXT;
BEGIN
    -- Obtener número de hoja
    SELECT numero_hr INTO hoja_numero FROM hojas_ruta WHERE id = p_hoja_id;
    
    IF hoja_numero IS NULL THEN
        RETURN '{"success": false, "error": "Hoja de ruta no encontrada"}';
    END IF;
    
    -- Actualizar el estado (esto disparará el trigger automáticamente)
    UPDATE hojas_ruta 
    SET 
        estado_cumplimiento = p_nuevo_estado,
        estado_detalle = COALESCE(p_estado_detalle, estado_detalle),
        fecha_completado = CASE WHEN p_nuevo_estado = 'completado' THEN CURRENT_TIMESTAMP ELSE fecha_completado END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_hoja_id;
    
    -- Retornar resultado exitoso
    resultado := '{"success": true, "mensaje": "Estado actualizado correctamente", "hoja": "' || hoja_numero || '", "nuevo_estado": "' || p_nuevo_estado || '"}';
    
    RETURN resultado;
    
EXCEPTION WHEN OTHERS THEN
    RETURN '{"success": false, "error": "' || SQLERRM || '"}';
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PASO 9: ACTUALIZAR HOJAS EXISTENTES CON DATOS DE EJEMPLO
-- ================================================================

-- Actualizar hojas existentes para que tengan fechas límite y estados
UPDATE hojas_ruta 
SET 
    fecha_limite = CASE 
        WHEN numero_hr LIKE '%001' THEN CURRENT_DATE + INTERVAL '2 days'
        WHEN numero_hr LIKE '%002' THEN CURRENT_DATE + INTERVAL '1 day'
        WHEN numero_hr LIKE '%003' THEN CURRENT_DATE - INTERVAL '3 days'
        WHEN numero_hr LIKE '%004' THEN CURRENT_DATE + INTERVAL '5 days'
        WHEN numero_hr LIKE '%005' THEN CURRENT_DATE + INTERVAL '10 days'
        WHEN numero_hr LIKE '%006' THEN CURRENT_DATE + INTERVAL '15 days'
        WHEN numero_hr LIKE '%007' THEN CURRENT_DATE + INTERVAL '6 days'
        ELSE CURRENT_DATE + INTERVAL '7 days'
    END,
    estado_cumplimiento = CASE 
        WHEN numero_hr LIKE '%005' THEN 'completado'
        WHEN numero_hr LIKE '%003' THEN 'vencido'
        WHEN numero_hr LIKE '%002' THEN 'en_proceso'
        ELSE 'pendiente'
    END
WHERE usuario_creador_id IS NOT NULL;

-- ================================================================
-- PASO 10: VERIFICACIONES
-- ================================================================

-- Verificar que los triggers estén creados
SELECT trigger_name, event_manipulation, action_timing 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table = 'hojas_ruta';

-- Verificar que la vista funcione
SELECT 
    numero_hr,
    estado_cumplimiento,
    icono_estado,
    alerta_vencimiento,
    dias_para_vencimiento
FROM dashboard_hojas_recientes 
LIMIT 5;

-- Verificar notificaciones
SELECT COUNT(*) as total_notificaciones FROM notificaciones;

-- Probar la función de cambio de estado
SELECT cambiar_estado_hoja(
    (SELECT id FROM hojas_ruta LIMIT 1),
    'en_proceso',
    'Revisión en curso',
    1
) as resultado_prueba;