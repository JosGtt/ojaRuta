-- ============================================
-- MIGRACIÓN 010: ÚLTIMAS MODIFICACIONES
-- ============================================
-- Fecha: 24/11/2025
-- Descripción: Solo las modificaciones más recientes del sistema de envíos
-- Incluye: funcionalidad de envíos, triggers y destinos actualizados

-- Ejecutar: psql -U tu_usuario -d tu_base_de_datos -f 010_migracion_completa_sistema_envios.sql

BEGIN;

-- ============================================
-- 1. TABLA ENVIOS ACTUALIZADA
-- ============================================

-- Eliminar tabla anterior si existe y recrear con estructura actual
DROP TABLE IF EXISTS envios CASCADE;

CREATE TABLE envios (
    id SERIAL PRIMARY KEY,
    hoja_id INTEGER REFERENCES hojas_ruta(id) ON DELETE SET NULL,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    
    -- Información del destinatario
    destinatario_nombre VARCHAR(200) NOT NULL,
    destinatario_correo VARCHAR(150),
    destinatario_numero VARCHAR(50),
    
    -- Destino (vinculado a tabla destinos)
    destino_id INTEGER REFERENCES destinos(id) ON DELETE SET NULL,
    
    -- Archivos y comentarios
    archivos JSONB DEFAULT '[]'::jsonb,
    comentarios TEXT,
    
    -- Estados del envío
    estado VARCHAR(50) DEFAULT 'registrado' CHECK (estado IN ('registrado', 'enviado', 'entregado', 'cancelado')),
    fecha_envio TIMESTAMP,
    fecha_entrega TIMESTAMP,
    
    -- Metadatos y fechas
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Índices para envios
CREATE INDEX IF NOT EXISTS idx_envios_hoja_id ON envios(hoja_id);
CREATE INDEX IF NOT EXISTS idx_envios_usuario_id ON envios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_envios_destino_id ON envios(destino_id);
CREATE INDEX IF NOT EXISTS idx_envios_estado ON envios(estado);
CREATE INDEX IF NOT EXISTS idx_envios_fecha_envio ON envios(fecha_envio);

-- ============================================
-- 2. FUNCIÓN PARA ACTUALIZAR UPDATED_AT EN ENVIOS
-- ============================================

CREATE OR REPLACE FUNCTION update_envios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para envios
DROP TRIGGER IF EXISTS trigger_update_envios_updated_at ON envios;
CREATE TRIGGER trigger_update_envios_updated_at
    BEFORE UPDATE ON envios
    FOR EACH ROW
    EXECUTE PROCEDURE update_envios_updated_at();

-- ============================================
-- 3. FUNCIÓN AUTOMÁTICA PARA ACTUALIZAR ESTADO DE HOJA
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
                CONCAT('Envío marcado como enviado automáticamente. Destinatario: ', NEW.destinatario_nombre),
                NEW.usuario_id,
                'finalizado',
                NEW.fecha_envio
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar estado automáticamente
DROP TRIGGER IF EXISTS trigger_actualizar_estado_hoja_por_envio ON envios;
CREATE TRIGGER trigger_actualizar_estado_hoja_por_envio
    BEFORE UPDATE ON envios
    FOR EACH ROW
    EXECUTE PROCEDURE actualizar_estado_hoja_por_envio();

-- ============================================
-- 4. AGREGAR COLUMNA TIPO A DESTINOS (SI NO EXISTE)
-- ============================================

-- Agregar columna tipo si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'destinos' AND column_name = 'tipo') THEN
        ALTER TABLE destinos ADD COLUMN tipo VARCHAR(50) DEFAULT 'administrativo';
    END IF;
END $$;

-- Actualizar tipos en destinos existentes
UPDATE destinos SET tipo = 'centro_acogida' WHERE nombre LIKE '%Centro%' OR nombre LIKE '%Instituto%';
UPDATE destinos SET tipo = 'direccion' WHERE nombre LIKE '%Dirección%' OR nombre LIKE '%Subdirección%' OR nombre LIKE '%Jefatura%';
UPDATE destinos SET tipo = 'departamento' WHERE nombre IN ('Departamento Legal', 'Recursos Humanos', 'Contabilidad', 'Archivo Central');
UPDATE destinos SET tipo = 'externo' WHERE nombre LIKE '%Ministerio%' OR nombre LIKE '%Defensoría%' OR nombre LIKE '%Gobernación%';

-- ============================================
-- 5. COMENTARIOS DE DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE envios IS 'Registro de envíos de documentos con destinatario completo y destino vinculado';
COMMENT ON COLUMN envios.destinatario_nombre IS 'Nombre completo del destinatario';
COMMENT ON COLUMN envios.destino_id IS 'ID del destino institucional vinculado';
COMMENT ON COLUMN envios.estado IS 'Estado del envío: registrado, enviado, entregado, cancelado';
COMMENT ON COLUMN envios.fecha_envio IS 'Fecha y hora cuando se marcó como enviado';

COMMIT;

SELECT 'MIGRACIÓN 010 APLICADA CORRECTAMENTE' as resultado,
       now() as fecha_aplicacion;

/*
RESUMEN DE CAMBIOS RECIENTES:

✅ Tabla envios reestructurada con nueva estructura
✅ Trigger automático para actualizar estado de hojas de ruta
✅ Función para manejar updated_at en envios
✅ Campo tipo agregado a destinos existentes
✅ Índices optimizados para mejor performance

Para aplicar: psql -U usuario -d base_datos -f 010_migracion_completa_sistema_envios.sql
*/