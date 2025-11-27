-- ============================================
-- PARCHE 012: CORREGIR TRIGGER DE ENVÍOS
-- ============================================
-- Fecha: 26/11/2025
-- Descripción: Cambia el trigger a AFTER UPDATE para evitar conflictos

-- Eliminar trigger anterior
DROP TRIGGER IF EXISTS trigger_actualizar_estado_hoja_por_envio ON envios;

-- Crear función corregida que funcione con AFTER UPDATE
CREATE OR REPLACE FUNCTION actualizar_estado_hoja_por_envio()
RETURNS TRIGGER AS $$
DECLARE
    destino_nombre VARCHAR(200);
BEGIN
    -- Solo actualizar si el estado cambió a 'enviado' y hay una hoja vinculada
    IF NEW.estado = 'enviado' AND (OLD IS NULL OR OLD.estado != 'enviado') AND NEW.hoja_id IS NOT NULL THEN
        
        -- Obtener el nombre del destino
        SELECT nombre INTO destino_nombre 
        FROM destinos 
        WHERE id = NEW.destino_id;
        
        -- Actualizar el estado Y la ubicación de la hoja de ruta
        UPDATE hojas_ruta 
        SET 
            estado = 'enviada',
            ubicacion_actual = COALESCE(destino_nombre, 'Destino no especificado'),
            responsable_actual = NEW.destinatario_nombre,
            updated_at = now()
        WHERE id = NEW.hoja_id;
        
        -- Log del cambio en seguimiento si la tabla existe
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seguimiento') THEN
            INSERT INTO seguimiento (
                hoja_ruta_id, 
                destino_id, 
                observaciones, 
                usuario_responsable_id,
                estado,
                fecha_envio
            ) VALUES (
                NEW.hoja_id,
                NEW.destino_id,
                CONCAT('Documento enviado a: ', COALESCE(destino_nombre, 'Destino no especificado'), '. Destinatario: ', NEW.destinatario_nombre),
                NEW.usuario_id,
                'finalizado',
                COALESCE(NEW.fecha_envio, now())
            );
        END IF;
        
        -- Log para debug
        RAISE NOTICE 'Hoja % enviada a: % con responsable: %', NEW.hoja_id, COALESCE(destino_nombre, 'Destino no especificado'), NEW.destinatario_nombre;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger AFTER UPDATE para evitar conflictos
CREATE TRIGGER trigger_actualizar_estado_hoja_por_envio
    AFTER UPDATE ON envios
    FOR EACH ROW
    EXECUTE PROCEDURE actualizar_estado_hoja_por_envio();

-- Verificación
SELECT 'TRIGGER CORREGIDO: Cambiado a AFTER UPDATE para evitar conflictos' as resultado;