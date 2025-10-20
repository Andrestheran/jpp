-- ============================================
-- AGREGAR COLUMNA evidence_files A LA TABLA items
-- ============================================

-- 1. Ver la estructura actual de la tabla items
SELECT 
  '1️⃣ COLUMNAS ACTUALES DE items' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'items'
ORDER BY ordinal_position;

-- 2. Agregar la columna evidence_files si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'items' 
          AND column_name = 'evidence_files'
    ) THEN
        ALTER TABLE items ADD COLUMN evidence_files TEXT[];
        RAISE NOTICE '✅ Columna evidence_files agregada exitosamente';
    ELSE
        RAISE NOTICE '⚠️  La columna evidence_files ya existe';
    END IF;
END $$;

-- 3. Hacer la columna subsection_id opcional (si no lo es ya)
ALTER TABLE items ALTER COLUMN subsection_id DROP NOT NULL;

-- 4. Verificar que la columna existe ahora
SELECT 
  '2️⃣ VERIFICACIÓN - Columna evidence_files' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'items' 
        AND column_name = 'evidence_files'
    ) THEN '✅ La columna evidence_files EXISTE'
    ELSE '❌ La columna evidence_files NO EXISTE'
  END as estado;

-- 5. Ver todas las columnas actualizadas
SELECT 
  '3️⃣ ESTRUCTURA FINAL DE items' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'items'
ORDER BY ordinal_position;

-- 6. Agregar comentario descriptivo
COMMENT ON COLUMN items.evidence_files IS 'Array of URLs to evidence files uploaded for this question (from multimedia storage bucket)';

