-- Script para verificar items duplicados en la base de datos
-- Ejecuta esto en Supabase SQL Editor para ver si hay problemas

-- 1. Verificar items duplicados por código
SELECT 
    code, 
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as ids
FROM items
GROUP BY code
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Contar total de items
SELECT COUNT(*) as total_items FROM items;

-- 3. Contar items por dominio (a través de subsections)
SELECT 
    d.code as domain_code,
    d.title as domain_title,
    COUNT(i.id) as item_count
FROM domains d
LEFT JOIN subsections s ON s.domain_id = d.id
LEFT JOIN items i ON i.subsection_id = s.id
GROUP BY d.id, d.code, d.title
ORDER BY d.code;

-- 4. Ver todos los items con sus códigos y subsecciones
SELECT 
    i.id,
    i.code,
    i.title,
    s.code as subsection_code,
    s.title as subsection_title,
    d.code as domain_code,
    d.title as domain_title
FROM items i
JOIN subsections s ON i.subsection_id = s.id
JOIN domains d ON s.domain_id = d.id
ORDER BY i.code;

