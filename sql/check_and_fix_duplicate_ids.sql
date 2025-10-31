-- ==========================================
-- VERIFICAR Y CORREGIR IDs DUPLICADOS
-- ==========================================

-- PASO 1: Verificar si hay IDs duplicados en la tabla items
SELECT 
    '🔍 PASO 1: Verificar IDs duplicados en items' as info,
    id,
    COUNT(*) as cantidad_duplicados,
    STRING_AGG(code || ' - ' || title, '; ') as items_afectados
FROM items
GROUP BY id
HAVING COUNT(*) > 1
ORDER BY cantidad_duplicados DESC;

-- PASO 2: Contar total de items
SELECT 
    '📊 PASO 2: Total de items' as info,
    COUNT(*) as total_items,
    COUNT(DISTINCT id) as ids_unicos,
    COUNT(*) - COUNT(DISTINCT id) as items_duplicados
FROM items;

-- PASO 3: Ver los items sin duplicar (para verificar)
SELECT 
    '✅ PASO 3: Sample de items únicos' as info,
    id,
    code,
    title,
    subsection_id
FROM items
ORDER BY code
LIMIT 10;

-- PASO 4: Si hay duplicados, este query muestra TODOS los detalles
WITH duplicate_ids AS (
    SELECT id
    FROM items
    GROUP BY id
    HAVING COUNT(*) > 1
)
SELECT 
    '🚨 PASO 4: Detalles completos de items duplicados' as info,
    i.id,
    i.code,
    i.title,
    i.subsection_id,
    s.code as subsection_code,
    s.title as subsection_title,
    d.code as domain_code,
    d.title as domain_title
FROM items i
JOIN duplicate_ids di ON di.id = i.id
LEFT JOIN subsections s ON s.id = i.subsection_id
LEFT JOIN domains d ON d.id = s.domain_id
ORDER BY i.id, i.code;

-- ==========================================
-- NOTA IMPORTANTE:
-- Si el PASO 1 muestra duplicados, HAY UN PROBLEMA GRAVE
-- Los IDs deben ser ÚNICOS (UUID o serial)
-- 
-- SI HAY DUPLICADOS:
-- 1. La causa probable es un error en la inserción de datos
-- 2. Necesitas eliminar o actualizar los duplicados
-- 3. Asegurar que la columna 'id' tenga constraint UNIQUE
-- ==========================================

-- PASO 5: Verificar que la columna ID tiene constraint único
SELECT 
    '🔒 PASO 5: Constraints en columna id' as info,
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'items'::regclass
  AND conkey @> ARRAY[(
    SELECT attnum 
    FROM pg_attribute 
    WHERE attrelid = 'items'::regclass 
      AND attname = 'id'
  )];

-- PASO 6: Ver estructura de la tabla items
SELECT 
    '📋 PASO 6: Estructura de la tabla items' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'items'
  AND table_schema = 'public'
ORDER BY ordinal_position;

