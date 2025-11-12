-- Migración para agregar campos de nombre del solicitante y teléfono celular
-- Fecha: 2024-01-20

BEGIN;

-- Agregar columna nombre_solicitante
ALTER TABLE hojas_ruta 
ADD COLUMN nombre_solicitante VARCHAR(255);

-- Agregar columna telefono_celular
ALTER TABLE hojas_ruta 
ADD COLUMN telefono_celular VARCHAR(20);

-- Actualizar la función de trigger para incluir los nuevos campos en el log
CREATE OR REPLACE FUNCTION update_hoja_ruta_modified_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_modificacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'hojas_ruta' 
AND column_name IN ('nombre_solicitante', 'telefono_celular');