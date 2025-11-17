-- Migración 006: Crear tabla envios para funcionalidad de envío de documentos
-- Ejecutar: psql -U tu_usuario -d tu_base_de_datos -f 006_crear_tabla_envios.sql

-- Crear tabla envios
CREATE TABLE IF NOT EXISTS envios (
    id SERIAL PRIMARY KEY,
    hoja_id INTEGER REFERENCES hojas_ruta(id) ON DELETE SET NULL,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    destinatario TEXT NOT NULL,
    archivos JSONB DEFAULT '[]'::jsonb,
    comentarios TEXT,
    estado TEXT DEFAULT 'registrado' CHECK (estado IN ('registrado', 'enviado', 'entregado', 'cancelado')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_envios_hoja_id ON envios(hoja_id);
CREATE INDEX IF NOT EXISTS idx_envios_usuario_id ON envios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_envios_estado ON envios(estado);
CREATE INDEX IF NOT EXISTS idx_envios_created_at ON envios(created_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_envios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_envios_updated_at ON envios;
CREATE TRIGGER trigger_update_envios_updated_at
    BEFORE UPDATE ON envios
    FOR EACH ROW
    EXECUTE PROCEDURE update_envios_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE envios IS 'Registro de envíos de documentos y archivos relacionados con hojas de ruta';
COMMENT ON COLUMN envios.id IS 'Identificador único del envío';
COMMENT ON COLUMN envios.hoja_id IS 'ID de la hoja de ruta relacionada (opcional)';
COMMENT ON COLUMN envios.usuario_id IS 'ID del usuario que realiza el envío';
COMMENT ON COLUMN envios.destinatario IS 'Nombre, email o identificación del destinatario';
COMMENT ON COLUMN envios.archivos IS 'Metadatos de archivos adjuntos en formato JSON';
COMMENT ON COLUMN envios.comentarios IS 'Comentarios adicionales del envío';
COMMENT ON COLUMN envios.estado IS 'Estado del envío: registrado, enviado, entregado, cancelado';
COMMENT ON COLUMN envios.metadata IS 'Metadatos adicionales en formato JSON';
COMMENT ON COLUMN envios.created_at IS 'Fecha y hora de creación del envío';
COMMENT ON COLUMN envios.updated_at IS 'Fecha y hora de última actualización';

-- Insertar datos de ejemplo (opcional - comentado)
/*
INSERT INTO envios (hoja_id, usuario_id, destinatario, comentarios, archivos) VALUES 
(1, 1, 'juan.perez@example.com', 'Envío de documentos urgentes', '[{"name": "documento1.pdf", "size": 1024, "type": "application/pdf"}]'::jsonb),
(2, 1, 'Maria González', 'Documentos de trámite completado', '[{"name": "certificado.jpg", "size": 2048, "type": "image/jpeg"}]'::jsonb);
*/

-- Verificación final
SELECT 'Tabla envios creada correctamente' AS resultado;