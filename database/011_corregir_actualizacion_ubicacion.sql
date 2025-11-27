-- ============================================
-- PARCHE 011: CORREGIR ACTUALIZACIÓN DE UBICACIÓN EN ENVÍOS
-- ============================================
-- Fecha: 26/11/2025
-- Descripción: Corrige el trigger para que actualice la ubicación cuando se marca un envío como "enviado"
-- Ejecutar: psql -U tu_usuario -d tu_base_de_datos -f 011_corregir_actualizacion_ubicacion.sql

-- ============================================
-- FUNCIÓN CORREGIDA: ACTUALIZAR UBICACIÓN Y ESTADO
-- ============================================

CREATE OR REPLACE FUNCTION actualizar_estado_hoja_por_envio()
RETURNS TRIGGER AS $$
DECLARE
    destino_nombre VARCHAR(200);
BEGIN
    -- Solo actualizar si el estado cambió a 'enviado' y hay una hoja vinculada
    IF NEW.estado = 'enviado' AND (OLD IS NULL OR OLD.estado != 'enviado') AND NEW.hoja_id IS NOT NULL THEN
        -- Actualizar fecha_envio si no está establecida
        IF NEW.fecha_envio IS NULL THEN
            NEW.fecha_envio = now();
        END IF;
        
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
                NEW.fecha_envio
            );
        END IF;
        
        -- Log para debug
        RAISE NOTICE 'Hoja % enviada a: % con responsable: %', NEW.hoja_id, COALESCE(destino_nombre, 'Destino no especificado'), NEW.destinatario_nombre;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar que el trigger existe
DROP TRIGGER IF EXISTS trigger_actualizar_estado_hoja_por_envio ON envios;
CREATE TRIGGER trigger_actualizar_estado_hoja_por_envio
    BEFORE UPDATE ON envios
    FOR EACH ROW
    EXECUTE PROCEDURE actualizar_estado_hoja_por_envio();

-- Verificación
SELECT 'FUNCIÓN CORREGIDA: Ahora actualiza ubicación_actual y responsable_actual cuando se marca envío como enviado' as resultado;

/*
CAMBIOS APLICADOS:

✅ La función ahora obtiene el nombre del destino desde la tabla destinos
✅ Actualiza ubicacion_actual con el nombre del destino
✅ Actualiza responsable_actual con el nombre del destinatario
✅ Incluye mensaje mejorado en el log de seguimiento
✅ Agrega log de debug para verificar que funciona

FUNCIONAMIENTO:
- Cuando marques un envío como "enviado"
- Automáticamente actualizará la ubicación de la hoja de ruta al destino seleccionado
- El responsable será el destinatario especificado en el envío
- El estado cambiará a "enviada"

Para probar:
1. Crea un envío con un destino específico
2. Márcalo como "enviado"
3. Verifica que la ubicación en la hoja de ruta cambie al destino
*/