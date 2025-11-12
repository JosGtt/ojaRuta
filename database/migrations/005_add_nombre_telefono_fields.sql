-- Migración para agregar campos de nombre y teléfono a hojas de ruta
-- Fecha: 2025-11-11

-- Agregar los nuevos campos a la tabla hojas_ruta
ALTER TABLE hojas_ruta 
ADD COLUMN nombre_solicitante VARCHAR(200),
ADD COLUMN telefono_celular VARCHAR(20);

-- Crear índices para búsquedas
CREATE INDEX idx_hojas_ruta_nombre_solicitante ON hojas_ruta(nombre_solicitante);

-- Comentarios sobre los nuevos campos
COMMENT ON COLUMN hojas_ruta.nombre_solicitante IS 'Nombre completo de la persona solicitante';
COMMENT ON COLUMN hojas_ruta.telefono_celular IS 'Número de teléfono o celular de contacto';

-- Verificar la estructura actualizada
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns 
WHERE table_name = 'hojas_ruta' 
  AND column_name IN ('nombre_solicitante', 'telefono_celular');