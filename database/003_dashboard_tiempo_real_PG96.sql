-- ================================================================
-- ACTUALIZACIÓN COMPLETA BD PARA DASHBOARD EN TIEMPO REAL
-- VERSIÓN COMPATIBLE CON POSTGRESQL 9.6
-- ================================================================
-- Ejecutar en PgAdmin paso a paso

-- ================================================================
-- PASO 1: MEJORAR ESTADOS DE CUMPLIMIENTO
-- ================================================================

-- Agregar más estados para las hojas de ruta
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'hojas_ruta' AND column_name = 'estado_detalle') THEN
        ALTER TABLE hojas_ruta ADD COLUMN estado_detalle TEXT DEFAULT 'En trámite';
    END IF;
END $$;

-- Los estados posibles serán:
-- estado_cumplimiento: 'pendiente', 'en_proceso', 'completado', 'vencido', 'cancelado', 'erroneo'
-- estado_detalle: descripción más específica

-- ================================================================
-- PASO 2: CREAR FUNCIÓN PARA ACTUALIZAR ESTADÍSTICAS
-- ================================================================

-- Función que se ejecuta cada vez que se modifica una hoja de ruta
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
-- PASO 3: CREAR TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA (POSTGRESQL 9.6)
-- ================================================================

-- Eliminar triggers existentes si los hay
DROP TRIGGER IF EXISTS trigger_nueva_hoja ON hojas_ruta;
DROP TRIGGER IF EXISTS trigger_cambio_estado ON hojas_ruta;

-- Trigger para INSERT (nuevas hojas) - COMPATIBLE CON POSTGRESQL 9.6
CREATE TRIGGER trigger_nueva_hoja
    AFTER INSERT ON hojas_ruta
    FOR EACH ROW
    EXECUTE PROCEDURE actualizar_estadisticas_dashboard();

-- Trigger para UPDATE (cambios de estado) - COMPATIBLE CON POSTGRESQL 9.6
CREATE TRIGGER trigger_cambio_estado
    AFTER UPDATE ON hojas_ruta
    FOR EACH ROW
    EXECUTE PROCEDURE actualizar_estadisticas_dashboard();

-- ================================================================
-- PASO 4: MEJORAR LA TABLA DE NOTIFICACIONES
-- ================================================================

-- Agregar índices para mejor rendimiento (solo si no existen)
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
END $$;

-- ================================================================
-- PASO 5: CREAR VISTA PARA DASHBOARD EN TIEMPO REAL
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
    
    u.nombre as creador_nombre
FROM hojas_ruta hr
LEFT JOIN usuarios u ON hr.usuario_creador_id = u.id
WHERE hr.estado != 'eliminado'
ORDER BY hr.created_at DESC;

-- ================================================================
-- PASO 6: FUNCIÓN PARA CAMBIAR ESTADO DE HOJA DE RUTA (POSTGRESQL 9.6)
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
-- PASO 7: VERIFICAR QUE TODO FUNCIONE
-- ================================================================

-- Probar la función de cambio de estado
SELECT cambiar_estado_hoja(
    (SELECT id FROM hojas_ruta WHERE numero_hr LIKE 'HR-2025-%' LIMIT 1),
    'en_proceso',
    'Revisión en curso',
    1
) as resultado_prueba;

-- Ver notificaciones generadas
SELECT 
    tipo,
    mensaje,
    fecha_creacion,
    leida
FROM notificaciones 
ORDER BY fecha_creacion DESC 
LIMIT 5;

-- Verificar que la vista funcione
SELECT 
    numero_hr,
    estado_cumplimiento,
    icono_estado,
    alerta_vencimiento
FROM dashboard_hojas_recientes 
LIMIT 3;

-- Verificar que los triggers estén creados
SELECT trigger_name, event_manipulation, action_timing 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table = 'hojas_ruta';