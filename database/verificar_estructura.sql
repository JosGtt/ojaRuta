-- VERIFICAR ESTRUCTURA ACTUAL DE TU BASE DE DATOS
-- Ejecuta esto en PgAdmin para ver qué columnas tienes

-- 1. Ver estructura de la tabla hojas_ruta
\d hojas_ruta;

-- 2. Ver qué datos tienes
SELECT 
    numero_hr,
    referencia,
    estado_cumplimiento,
    prioridad,
    dias_para_vencimiento
FROM hojas_ruta 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Verificar si ya existen las columnas de ubicación
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'hojas_ruta' 
AND column_name IN ('ubicacion_actual', 'responsable_actual');