-- ==================================================================
-- MIGRACIÓN OPCIONAL: AGREGAR UBICACIONES A HOJAS DE RUTA
-- ==================================================================
-- Solo ejecutar si quieres la funcionalidad de ubicaciones
-- Si no la ejecutas, el sistema funciona igual sin ubicaciones

-- 1. Agregar columnas de ubicación
ALTER TABLE hojas_ruta 
ADD COLUMN IF NOT EXISTS ubicacion_actual VARCHAR(100) DEFAULT 'Mesa de Partes';

ALTER TABLE hojas_ruta 
ADD COLUMN IF NOT EXISTS responsable_actual VARCHAR(100) DEFAULT 'Área de Despacho';

-- 2. Actualizar hojas existentes con ubicaciones realistas
UPDATE hojas_ruta 
SET ubicacion_actual = CASE 
    WHEN estado_cumplimiento = 'completado' THEN 'Archivo General'
    WHEN estado_cumplimiento = 'vencido' THEN 'Mesa de Partes - URGENTE'
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

-- 3. Verificar cambios
SELECT 
    numero_hr,
    LEFT(referencia, 30) as referencia_corta,
    prioridad,
    estado_cumplimiento,
    ubicacion_actual,
    responsable_actual
FROM hojas_ruta 
WHERE numero_hr LIKE 'HR-2025-%'
ORDER BY numero_hr;