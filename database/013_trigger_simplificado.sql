-- SIMPLIFICAR EL TRIGGER PARA DEBUG
DROP TRIGGER IF EXISTS trigger_actualizar_estado_hoja_por_envio ON envios;

-- Función simplificada solo para actualizar ubicación
CREATE OR REPLACE FUNCTION actualizar_estado_hoja_por_envio()
RETURNS TRIGGER AS $$
DECLARE
    destino_nombre VARCHAR(200);
BEGIN
    -- Solo actualizar si el estado cambió a 'enviado' y hay una hoja vinculada
    IF NEW.estado = 'enviado' AND (OLD IS NULL OR OLD.estado != 'enviado') AND NEW.hoja_id IS NOT NULL THEN
        
        -- Debug
        RAISE NOTICE 'Trigger ejecutándose para envío % con hoja %', NEW.id, NEW.hoja_id;
        
        -- Obtener el nombre del destino
        IF NEW.destino_id IS NOT NULL THEN
            SELECT nombre INTO destino_nombre 
            FROM destinos 
            WHERE id = NEW.destino_id;
            
            RAISE NOTICE 'Destino encontrado: %', destino_nombre;
        END IF;
        
        -- Actualizar el estado Y la ubicación de la hoja de ruta
        UPDATE hojas_ruta 
        SET 
            estado = 'enviada',
            ubicacion_actual = COALESCE(destino_nombre, 'Destino no especificado'),
            responsable_actual = NEW.destinatario_nombre,
            updated_at = now()
        WHERE id = NEW.hoja_id;
        
        RAISE NOTICE 'Hoja % actualizada a ubicación: %', NEW.hoja_id, COALESCE(destino_nombre, 'Destino no especificado');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger simplificado
CREATE TRIGGER trigger_actualizar_estado_hoja_por_envio
    AFTER UPDATE ON envios
    FOR EACH ROW
    EXECUTE PROCEDURE actualizar_estado_hoja_por_envio();

SELECT 'Trigger simplificado creado' as resultado;