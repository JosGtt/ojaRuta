-- MIGRACIÓN SIMPLE PARA POSTGRESQL 9.6
-- Ejecutar en PgAdmin Query Tool

-- Solo agregar las columnas si no existen
DO $$
BEGIN
    -- Verificar y agregar ubicacion_actual
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'hojas_ruta' AND column_name = 'ubicacion_actual') THEN
        ALTER TABLE hojas_ruta ADD COLUMN ubicacion_actual VARCHAR(100) DEFAULT 'Oficina Central';
    END IF;
    
    -- Verificar y agregar responsable_actual  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'hojas_ruta' AND column_name = 'responsable_actual') THEN
        ALTER TABLE hojas_ruta ADD COLUMN responsable_actual VARCHAR(100) DEFAULT 'Mesa de Partes';
    END IF;
    
    RAISE NOTICE 'Columnas agregadas exitosamente';
END $$;

-- Actualizar hojas existentes con ubicaciones realistas
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
END;

-- Verificar que se aplicaron los cambios
SELECT 
    numero_hr,
    LEFT(referencia, 30) as referencia_corta,
    estado_cumplimiento,
    prioridad,
    ubicacion_actual,
    responsable_actual
FROM hojas_ruta 
ORDER BY created_at DESC 
LIMIT 10;