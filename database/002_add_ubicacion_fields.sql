-- Migración para agregar campo de ubicación a hojas de ruta
-- Ejecutar en PgAdmin Query Tool

-- Agregar columna de ubicación actual
ALTER TABLE hojas_ruta 
ADD COLUMN ubicacion_actual VARCHAR(100) DEFAULT 'Oficina Central';

-- Agregar columna de responsable actual
ALTER TABLE hojas_ruta 
ADD COLUMN responsable_actual VARCHAR(100) DEFAULT 'Área de Despacho';

-- Agregar índice para búsquedas por ubicación
CREATE INDEX idx_hojas_ruta_ubicacion ON hojas_ruta(ubicacion_actual);

-- Actualizar hojas existentes con ubicaciones de ejemplo
UPDATE hojas_ruta 
SET ubicacion_actual = CASE 
    WHEN estado_cumplimiento = 'completado' THEN 'Archivo General'
    WHEN estado_cumplimiento = 'vencido' THEN 'Mesa de Partes'
    WHEN prioridad = 'urgente' THEN 'Despacho Director'
    WHEN prioridad = 'prioritario' THEN 'Secretaría General'
    ELSE 'Oficina de Trámites'
END,
responsable_actual = CASE 
    WHEN estado_cumplimiento = 'completado' THEN 'Archivo Central'
    WHEN estado_cumplimiento = 'vencido' THEN 'Mesa de Partes'
    WHEN prioridad = 'urgente' THEN 'Director General'
    WHEN prioridad = 'prioritario' THEN 'Secretario General'
    ELSE 'Jefe de Trámites'
END
WHERE numero_hr LIKE 'HR-2025-%';

-- Verificar cambios
SELECT 
    numero_hr,
    LEFT(referencia, 40) as referencia,
    estado_cumplimiento,
    prioridad,
    ubicacion_actual,
    responsable_actual
FROM hojas_ruta 
WHERE numero_hr LIKE 'HR-2025-%'
ORDER BY numero_hr;