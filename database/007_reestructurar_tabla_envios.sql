-- Migración 007: Reestructurar tabla envios con destinatario completo y destino vinculado
-- Ejecutar: psql -U tu_usuario -d tu_base_de_datos -f 007_reestructurar_tabla_envios.sql

-- 1. Crear tabla temporal con la nueva estructura
CREATE TABLE envios_new (
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

-- 2. Migrar datos existentes (si los hay)
-- Extraer información del campo destinatario existente
INSERT INTO envios_new (
    hoja_id, 
    usuario_id, 
    destinatario_nombre, 
    destinatario_correo,
    archivos, 
    comentarios, 
    estado, 
    metadata, 
    created_at, 
    updated_at
)
SELECT 
    hoja_id,
    usuario_id,
    CASE 
        WHEN destinatario ~ '^[^@]+@[^@]+\.[^@]+$' THEN 'Destinatario'
        ELSE destinatario
    END as destinatario_nombre,
    CASE 
        WHEN destinatario ~ '^[^@]+@[^@]+\.[^@]+$' THEN destinatario
        ELSE NULL
    END as destinatario_correo,
    archivos,
    comentarios,
    estado,
    metadata,
    created_at,
    updated_at
FROM envios
WHERE EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'envios');

-- 3. Eliminar tabla anterior y renombrar la nueva
DROP TABLE IF EXISTS envios CASCADE;
ALTER TABLE envios_new RENAME TO envios;

-- 4. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_envios_hoja_id ON envios(hoja_id);
CREATE INDEX IF NOT EXISTS idx_envios_usuario_id ON envios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_envios_destino_id ON envios(destino_id);
CREATE INDEX IF NOT EXISTS idx_envios_estado ON envios(estado);
CREATE INDEX IF NOT EXISTS idx_envios_fecha_envio ON envios(fecha_envio);
CREATE INDEX IF NOT EXISTS idx_envios_created_at ON envios(created_at);

-- 5. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_envios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_envios_updated_at ON envios;
CREATE TRIGGER trigger_update_envios_updated_at
    BEFORE UPDATE ON envios
    FOR EACH ROW
    EXECUTE PROCEDURE update_envios_updated_at();

-- 7. Función para actualizar estado de hoja de ruta automáticamente cuando se marca envío como enviado
CREATE OR REPLACE FUNCTION actualizar_estado_hoja_por_envio()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar si el estado cambió a 'enviado' y hay una hoja vinculada
    IF NEW.estado = 'enviado' AND OLD.estado != 'enviado' AND NEW.hoja_id IS NOT NULL THEN
        -- Actualizar fecha_envio si no está establecida
        IF NEW.fecha_envio IS NULL THEN
            NEW.fecha_envio = now();
        END IF;
        
        -- Actualizar el estado de la hoja de ruta
        UPDATE hojas_ruta 
        SET 
            estado = 'enviada',
            updated_at = now()
        WHERE id = NEW.hoja_id;
        
        -- Log del cambio
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para actualizar estado de hoja automáticamente
CREATE TRIGGER trigger_actualizar_estado_hoja_por_envio
    BEFORE UPDATE ON envios
    FOR EACH ROW
    EXECUTE PROCEDURE actualizar_estado_hoja_por_envio();

-- 9. Comentarios para documentación
COMMENT ON TABLE envios IS 'Registro de envíos de documentos con destinatario completo y destino vinculado';
COMMENT ON COLUMN envios.id IS 'Identificador único del envío';
COMMENT ON COLUMN envios.hoja_id IS 'ID de la hoja de ruta relacionada (opcional)';
COMMENT ON COLUMN envios.usuario_id IS 'ID del usuario que realiza el envío';
COMMENT ON COLUMN envios.destinatario_nombre IS 'Nombre completo del destinatario';
COMMENT ON COLUMN envios.destinatario_correo IS 'Correo electrónico del destinatario (opcional)';
COMMENT ON COLUMN envios.destinatario_numero IS 'Número de teléfono del destinatario (opcional)';
COMMENT ON COLUMN envios.destino_id IS 'ID del destino institucional vinculado';
COMMENT ON COLUMN envios.archivos IS 'Metadatos de archivos adjuntos en formato JSON';
COMMENT ON COLUMN envios.comentarios IS 'Comentarios adicionales del envío';
COMMENT ON COLUMN envios.estado IS 'Estado del envío: registrado, enviado, entregado, cancelado';
COMMENT ON COLUMN envios.fecha_envio IS 'Fecha y hora cuando se marcó como enviado';
COMMENT ON COLUMN envios.fecha_entrega IS 'Fecha y hora cuando se marcó como entregado';
COMMENT ON COLUMN envios.metadata IS 'Metadatos adicionales en formato JSON';
COMMENT ON COLUMN envios.created_at IS 'Fecha y hora de creación del envío';
COMMENT ON COLUMN envios.updated_at IS 'Fecha y hora de última actualización';

-- 10. Verificación final
SELECT 'Tabla envios reestructurada correctamente' AS resultado;

-- 11. Mostrar estructura final
\d envios;