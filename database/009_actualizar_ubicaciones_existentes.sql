-- Actualizar hojas de ruta existentes para establecer ubicación por defecto
UPDATE hojas_ruta 
SET ubicacion_actual = 'SEDEGES', 
    responsable_actual = 'Sistema SEDEGES' 
WHERE ubicacion_actual IS NULL 
   OR ubicacion_actual = '';

-- Verificar los resultados
SELECT id, numero_hr, referencia, ubicacion_actual, responsable_actual 
FROM hojas_ruta 
ORDER BY id DESC 
LIMIT 10;