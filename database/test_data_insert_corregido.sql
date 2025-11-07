-- Script para insertar datos de prueba y probar todas las funcionalidades
-- Ejecutar en PgAdmin Query Tool - CORREGIDO PARA ESTRUCTURA REAL

-- ============================================================
-- 1. INSERTAR DATOS DE PRUEBA VARIADOS
-- ============================================================

-- Obtener el ID del usuario 'jose' existente
DO $$
DECLARE
    usuario_id INTEGER;
BEGIN
    SELECT id INTO usuario_id FROM usuarios WHERE usuario = 'jose' LIMIT 1;
    
    -- Si no existe el usuario jose, usar ID 1 por defecto
    IF usuario_id IS NULL THEN
        usuario_id := 1;
    END IF;
    
    -- CASO 1: Hoja URGENTE (vence en 2 días)
    INSERT INTO hojas_ruta (
        numero_hr, referencia, procedencia, fecha_limite, cite, numero_fojas, 
        prioridad, estado, usuario_creador_id, estado_cumplimiento
    ) VALUES (
        'HR-2025-001', 
        'Solicitud urgente aprobación presupuestaria proyecto emergente',
        'Ministerio de Economía y Finanzas', 
        CURRENT_DATE + INTERVAL '2 days',
        'MEF/CITE/001/2025',
        15,
        'urgente',
        'pendiente',
        usuario_id,
        'pendiente'
    );

    -- CASO 2: Hoja CRÍTICA (vence en 1 día)
    INSERT INTO hojas_ruta (
        numero_hr, referencia, procedencia, fecha_limite, cite, numero_fojas,
        prioridad, estado, usuario_creador_id, estado_cumplimiento
    ) VALUES (
        'HR-2025-002',
        'Informe técnico infraestructura hospitalaria URGENTE',
        'Servicio Departamental de Salud',
        CURRENT_DATE + INTERVAL '1 day',
        'SEDES/INF/045/2025',
        28,
        'urgente',
        'pendiente',
        usuario_id,
        'en_proceso'
    );

    -- CASO 3: Hoja VENCIDA (vencida hace 3 días)
    INSERT INTO hojas_ruta (
        numero_hr, referencia, procedencia, fecha_limite, cite, numero_fojas,
        prioridad, estado, usuario_creador_id, estado_cumplimiento
    ) VALUES (
        'HR-2025-003',
        'Revisión contratos servicios públicos',
        'Autoridad de Transporte Urbano',
        CURRENT_DATE - INTERVAL '3 days',
        'ATU/REV/089/2025',
        42,
        'prioritario',
        'pendiente',
        usuario_id,
        'vencido'
    );

    -- CASO 4: Hoja PRÓXIMA A VENCER (5 días)
    INSERT INTO hojas_ruta (
        numero_hr, referencia, procedencia, fecha_limite, cite, numero_fojas,
        prioridad, estado, usuario_creador_id, estado_cumplimiento
    ) VALUES (
        'HR-2025-004',
        'Evaluación programas sociales primer semestre',
        'Secretaría de Desarrollo Social',
        CURRENT_DATE + INTERVAL '5 days',
        'SDS/EVAL/234/2025',
        67,
        'prioritario',
        'pendiente',
        usuario_id,
        'pendiente'
    );

    -- CASO 5: Hoja COMPLETADA (para probar filtros)
    INSERT INTO hojas_ruta (
        numero_hr, referencia, procedencia, fecha_limite, cite, numero_fojas,
        prioridad, estado, usuario_creador_id, estado_cumplimiento, fecha_completado
    ) VALUES (
        'HR-2025-005',
        'Aprobación modificaciones presupuestarias Q3',
        'Dirección General de Presupuestos',
        CURRENT_DATE + INTERVAL '10 days',
        'DGP/APRO/156/2025',
        23,
        'rutinario',
        'pendiente',
        usuario_id,
        'completado',
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    );

    -- CASO 6: Hoja NORMAL (plazo normal)
    INSERT INTO hojas_ruta (
        numero_hr, referencia, procedencia, fecha_limite, cite, numero_fojas,
        prioridad, estado, usuario_creador_id, estado_cumplimiento
    ) VALUES (
        'HR-2025-006',
        'Plan anual capacitación personal administrativo',
        'Recursos Humanos Departamental',
        CURRENT_DATE + INTERVAL '15 days',
        'RHD/PLAN/078/2025',
        31,
        'rutinario',
        'pendiente',
        usuario_id,
        'pendiente'
    );

    -- CASO 7: Hoja EN PROCESO (vence en 6 días)
    INSERT INTO hojas_ruta (
        numero_hr, referencia, procedencia, fecha_limite, cite, numero_fojas,
        prioridad, estado, usuario_creador_id, estado_cumplimiento
    ) VALUES (
        'HR-2025-007',
        'Licitación pública equipamiento médico especializado',
        'Servicio Departamental de Salud',
        CURRENT_DATE + INTERVAL '6 days',
        'SEDES/LIC/192/2025',
        156,
        'prioritario',
        'pendiente',
        usuario_id,
        'en_proceso'
    );

    RAISE NOTICE 'Se insertaron 7 hojas de ruta de prueba exitosamente';

END $$;

-- ============================================================
-- 2. VERIFICAR QUE LOS TRIGGERS FUNCIONAN
-- ============================================================

-- Forzar actualización para activar triggers
UPDATE hojas_ruta SET updated_at = CURRENT_TIMESTAMP WHERE numero_hr LIKE 'HR-2025-%';

-- ============================================================
-- 3. CONSULTAS DE VERIFICACIÓN
-- ============================================================

-- Ver todas las hojas insertadas con sus estados calculados
SELECT 
    numero_hr,
    LEFT(referencia, 40) as referencia_corta,
    fecha_limite,
    dias_para_vencimiento,
    estado_cumplimiento,
    prioridad,
    CASE 
        WHEN dias_para_vencimiento < 0 THEN 'VENCIDA ⚠️'
        WHEN dias_para_vencimiento <= 3 THEN 'CRÍTICA 🔴'
        WHEN dias_para_vencimiento <= 7 THEN 'PRÓXIMA A VENCER 🟡'
        ELSE 'NORMAL 🟢'
    END as alerta_visual
FROM hojas_ruta 
WHERE numero_hr LIKE 'HR-2025-%'
ORDER BY dias_para_vencimiento ASC;

-- ============================================================
-- 4. PROBAR NOTIFICACIONES GENERADAS
-- ============================================================

-- Ver notificaciones creadas automáticamente
SELECT 
    n.tipo,
    n.mensaje,
    n.fecha_creacion,
    hr.numero_hr
FROM notificaciones n
JOIN hojas_ruta hr ON n.hoja_ruta_id = hr.id
WHERE hr.numero_hr LIKE 'HR-2025-%'
ORDER BY n.fecha_creacion DESC;

-- ============================================================
-- 5. PROBAR FUNCIONES DE MARCAR COMPLETADO
-- ============================================================

-- Ejemplo: Marcar una hoja como completada usando la función
-- SELECT marcar_completado((SELECT id FROM hojas_ruta WHERE numero_hr = 'HR-2025-004'));

-- ============================================================
-- 6. CONSULTAS ÚTILES PARA EL DASHBOARD
-- ============================================================

-- Estadísticas generales
SELECT 
    'ESTADÍSTICAS' as titulo,
    COUNT(*) as total_hojas,
    COUNT(*) FILTER (WHERE estado_cumplimiento = 'pendiente') as pendientes,
    COUNT(*) FILTER (WHERE estado_cumplimiento = 'en_proceso') as en_proceso,
    COUNT(*) FILTER (WHERE estado_cumplimiento = 'completado') as completadas,
    COUNT(*) FILTER (WHERE estado_cumplimiento = 'vencido') as vencidas,
    COUNT(*) FILTER (WHERE dias_para_vencimiento <= 3 AND estado_cumplimiento != 'completado') as criticas
FROM hojas_ruta 
WHERE numero_hr LIKE 'HR-2025-%';

-- Hojas por vencer (para el dashboard)
SELECT 
    'HOJAS POR VENCER' as titulo,
    numero_hr,
    dias_para_vencimiento,
    alerta_vencimiento
FROM hojas_por_vencer 
WHERE numero_hr LIKE 'HR-2025-%'
ORDER BY dias_para_vencimiento ASC
LIMIT 5;

-- ============================================================
-- 7. COMANDOS ADICIONALES PARA PRUEBAS
-- ============================================================

-- Para cambiar estado de una hoja:
-- UPDATE hojas_ruta SET estado_cumplimiento = 'completado', fecha_completado = CURRENT_TIMESTAMP WHERE numero_hr = 'HR-2025-006';

-- Para simular notificaciones (ejecutar varias veces para ver el efecto):
-- UPDATE hojas_ruta SET updated_at = CURRENT_TIMESTAMP WHERE estado_cumplimiento != 'completado';

COMMENT ON TABLE hojas_ruta IS 'Datos de prueba insertados para testing del sistema de fechas límite';