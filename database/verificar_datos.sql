-- ============================================================
-- VERIFICAR QUE LOS DATOS SE INSERTARON CORRECTAMENTE
-- ============================================================

-- 1. Ver todas las hojas de ruta de prueba
SELECT 
    numero_hr,
    LEFT(referencia, 50) as referencia,
    fecha_limite,
    dias_para_vencimiento,
    estado_cumplimiento,
    prioridad,
    CASE 
        WHEN dias_para_vencimiento < 0 THEN 'VENCIDA ⚠️'
        WHEN dias_para_vencimiento <= 3 THEN 'CRÍTICA 🔴'
        WHEN dias_para_vencimiento <= 7 THEN 'PRÓXIMA A VENCER 🟡'
        ELSE 'NORMAL 🟢'
    END as estado_visual
FROM hojas_ruta 
WHERE numero_hr LIKE 'HR-2025-%'
ORDER BY dias_para_vencimiento ASC;

-- 2. Estadísticas del dashboard
SELECT 
    'RESUMEN ESTADÍSTICAS' as categoria,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE estado_cumplimiento = 'pendiente') as pendientes,
    COUNT(*) FILTER (WHERE estado_cumplimiento = 'en_proceso') as en_proceso,
    COUNT(*) FILTER (WHERE estado_cumplimiento = 'completado') as completadas,
    COUNT(*) FILTER (WHERE estado_cumplimiento = 'vencido') as vencidas
FROM hojas_ruta 
WHERE numero_hr LIKE 'HR-2025-%';

-- 3. Ver notificaciones generadas automáticamente
SELECT 
    'NOTIFICACIONES AUTOMÁTICAS' as tipo,
    n.tipo,
    n.mensaje,
    hr.numero_hr,
    n.fecha_creacion
FROM notificaciones n
JOIN hojas_ruta hr ON n.hoja_ruta_id = hr.id
WHERE hr.numero_hr LIKE 'HR-2025-%'
ORDER BY n.fecha_creacion DESC;