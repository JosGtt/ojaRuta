-- Script para migrar datos existentes y corregir el problema de "nulld"
-- Ejecutar en PgAdmin después de la migración principal

-- 1. Actualizar hojas existentes: usar fecha_documento como fecha_limite si existe
UPDATE hojas_ruta 
SET fecha_limite = fecha_documento 
WHERE fecha_documento IS NOT NULL 
  AND fecha_limite IS NULL;

-- 2. Para hojas sin fecha_documento, asignar una fecha límite por defecto (7 días desde fecha_ingreso)
UPDATE hojas_ruta 
SET fecha_limite = fecha_ingreso + INTERVAL '7 days'
WHERE fecha_limite IS NULL;

-- 3. Forzar recálculo de todos los días de vencimiento
UPDATE hojas_ruta 
SET updated_at = CURRENT_TIMESTAMP
WHERE fecha_limite IS NOT NULL;

-- 4. Verificar que todas las hojas ahora tienen fecha_limite
SELECT 
    id, 
    numero_hr, 
    fecha_documento,
    fecha_limite,
    dias_para_vencimiento,
    estado_cumplimiento
FROM hojas_ruta 
ORDER BY fecha_ingreso DESC
LIMIT 10;