-- ==========================================
-- DIAGNOSTICAR PROBLEMA DE 26/47 RESPUESTAS
-- ==========================================

-- 1. Ver el total de items en la base de datos
SELECT 
    '1️⃣ TOTAL DE ITEMS EN LA BD' as info,
    COUNT(*) as total_items
FROM items;

-- 2. Verificar si hay IDs duplicados en items (no debería haber)
SELECT 
    '2️⃣ VERIFICAR IDs DUPLICADOS EN ITEMS' as info,
    id,
    COUNT(*) as count
FROM items
GROUP BY id
HAVING COUNT(*) > 1;

-- 3. Verificar si hay códigos duplicados (esto SÍ es normal)
SELECT 
    '3️⃣ CÓDIGOS DUPLICADOS (NORMAL)' as info,
    code,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as item_ids
FROM items
GROUP BY code
HAVING COUNT(*) > 1
ORDER BY count DESC, code;

-- 4. Ver la última evaluación y cuántas respuestas tiene
WITH last_eval AS (
    SELECT id, created_at, context
    FROM evaluations
    ORDER BY created_at DESC
    LIMIT 1
)
SELECT 
    '4️⃣ ÚLTIMA EVALUACIÓN' as info,
    e.id as evaluation_id,
    e.created_at,
    e.context->>'userName' as user_name,
    e.context->>'userEmail' as user_email,
    COUNT(a.id) as answers_count
FROM last_eval e
LEFT JOIN answers a ON a.evaluation_id = e.id
GROUP BY e.id, e.created_at, e.context;

-- 5. Ver distribución de respuestas de la última evaluación por dominio
WITH last_eval AS (
    SELECT id FROM evaluations ORDER BY created_at DESC LIMIT 1
)
SELECT 
    '5️⃣ RESPUESTAS POR DOMINIO (ÚLTIMA EVALUACIÓN)' as info,
    d.code as domain_code,
    d.title as domain_title,
    COUNT(a.id) as answers_count,
    COUNT(DISTINCT i.id) as unique_items_answered
FROM last_eval le
JOIN answers a ON a.evaluation_id = le.id
JOIN items i ON i.id = a.item_id
JOIN subsections s ON s.id = i.subsection_id
JOIN domains d ON d.id = s.domain_id
GROUP BY d.code, d.title
ORDER BY d.code;

-- 6. Ver si hay respuestas duplicadas para el mismo item en una evaluación
WITH last_eval AS (
    SELECT id FROM evaluations ORDER BY created_at DESC LIMIT 1
)
SELECT 
    '6️⃣ RESPUESTAS DUPLICADAS (MISMO ITEM EN MISMA EVALUACIÓN)' as info,
    a.evaluation_id,
    a.item_id,
    i.code as item_code,
    COUNT(*) as duplicate_count
FROM last_eval le
JOIN answers a ON a.evaluation_id = le.id
JOIN items i ON i.id = a.item_id
GROUP BY a.evaluation_id, a.item_id, i.code
HAVING COUNT(*) > 1;

-- 7. Ver el total de items por dominio en la BD
SELECT 
    '7️⃣ ITEMS DISPONIBLES POR DOMINIO' as info,
    d.code as domain_code,
    d.title as domain_title,
    COUNT(i.id) as total_items
FROM domains d
LEFT JOIN subsections s ON s.domain_id = d.id
LEFT JOIN items i ON i.subsection_id = s.id
GROUP BY d.code, d.title
ORDER BY d.code;

-- 8. Comparar items disponibles vs respondidos (última evaluación)
WITH last_eval AS (
    SELECT id FROM evaluations ORDER BY created_at DESC LIMIT 1
),
available_items AS (
    SELECT 
        d.code as domain_code,
        d.title as domain_title,
        COUNT(i.id) as available
    FROM domains d
    LEFT JOIN subsections s ON s.domain_id = d.id
    LEFT JOIN items i ON i.subsection_id = s.id
    GROUP BY d.code, d.title
),
answered_items AS (
    SELECT 
        d.code as domain_code,
        COUNT(DISTINCT a.item_id) as answered
    FROM last_eval le
    JOIN answers a ON a.evaluation_id = le.id
    JOIN items i ON i.id = a.item_id
    JOIN subsections s ON s.id = i.subsection_id
    JOIN domains d ON d.id = s.domain_id
    GROUP BY d.code
)
SELECT 
    '8️⃣ COMPARACIÓN: DISPONIBLES VS RESPONDIDOS' as info,
    av.domain_code,
    av.domain_title,
    av.available as items_disponibles,
    COALESCE(an.answered, 0) as items_respondidos,
    av.available - COALESCE(an.answered, 0) as items_faltantes
FROM available_items av
LEFT JOIN answered_items an ON an.domain_code = av.domain_code
ORDER BY av.domain_code;

-- 9. Ver las últimas 3 evaluaciones con su cantidad de respuestas
SELECT 
    '9️⃣ ÚLTIMAS 3 EVALUACIONES' as info,
    e.id,
    e.created_at,
    e.context->>'userName' as user_name,
    COUNT(a.id) as answers_count
FROM evaluations e
LEFT JOIN answers a ON a.evaluation_id = e.id
GROUP BY e.id, e.created_at, e.context
ORDER BY e.created_at DESC
LIMIT 3;

