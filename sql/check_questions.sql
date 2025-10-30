-- ============================================
-- VERIFICAR PREGUNTAS EN LA BASE DE DATOS
-- ============================================

-- PASO 1: Ver todos los dominios
SELECT 
  '📚 DOMINIOS' as info,
  id,
  code,
  title,
  weight
FROM domains
ORDER BY code;

-- PASO 2: Ver todas las subsecciones
SELECT 
  '📑 SUBSECCIONES' as info,
  s.id,
  s.code,
  s.title,
  d.title as dominio
FROM subsections s
JOIN domains d ON s.domain_id = d.id
ORDER BY s.code;

-- PASO 3: Ver todos los items/preguntas
SELECT 
  '❓ PREGUNTAS/ITEMS' as info,
  i.code,
  i.title,
  d.title as dominio,
  s.title as subseccion,
  i.requires_evidence
FROM items i
JOIN subsections s ON i.subsection_id = s.id
JOIN domains d ON s.domain_id = d.id
ORDER BY i.code;

-- PASO 4: Contar cuántas hay de cada tipo
SELECT 
  '📊 RESUMEN' as info,
  'Dominios' as tipo,
  COUNT(*) as cantidad
FROM domains
UNION ALL
SELECT '📊 RESUMEN', 'Subsecciones', COUNT(*) FROM subsections
UNION ALL
SELECT '📊 RESUMEN', 'Items/Preguntas', COUNT(*) FROM items;

