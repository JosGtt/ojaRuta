-- ============================================
-- MIGRACIÓN: AGREGAR COLUMNAS DE UBICACIÓN
-- ============================================
-- Este script agrega las columnas que necesita el sistema de envíos

-- Agregar columnas de ubicación a hojas_ruta
ALTER TABLE hojas_ruta 
ADD COLUMN IF NOT EXISTS ubicacion_actual VARCHAR(100) DEFAULT 'Mesa de Partes';

ALTER TABLE hojas_ruta 
ADD COLUMN IF NOT EXISTS responsable_actual VARCHAR(100) DEFAULT 'Área de Despacho';

-- Actualizar hojas existentes con ubicaciones realistas
UPDATE hojas_ruta 
SET ubicacion_actual = CASE 
    WHEN estado = 'completada' THEN 'Archivo General'
    WHEN estado = 'vencida' THEN 'Mesa de Partes - URGENTE' 
    WHEN prioridad = 'urgente' THEN 'Despacho Director'
    WHEN prioridad = 'prioritario' THEN 'Secretaría General'
    ELSE 'Oficina de Trámites'
END,
responsable_actual = CASE 
    WHEN estado = 'completada' THEN 'Archivo Central'
    WHEN estado = 'vencida' THEN 'Mesa de Partes'
    WHEN prioridad = 'urgente' THEN 'Director General'
    WHEN prioridad = 'prioritario' THEN 'Secretario General'  
    ELSE 'Jefe de Trámites'
END
WHERE ubicacion_actual IS NULL OR ubicacion_actual = 'Mesa de Partes';

-- Verificar que se agregaron correctamente
SELECT 
    COUNT(*) as total_hojas,
    COUNT(ubicacion_actual) as con_ubicacion,
    COUNT(responsable_actual) as con_responsable
FROM hojas_ruta;

COMMIT;