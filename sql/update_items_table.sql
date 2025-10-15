-- Update items table to support evidence files and optional subsection
-- Based on the existing schema

-- 1. Make subsection_id optional (if not already done)
ALTER TABLE items ALTER COLUMN subsection_id DROP NOT NULL;

-- 2. Add evidence_files column
ALTER TABLE items ADD COLUMN IF NOT EXISTS evidence_files TEXT[];

-- 3. Add comments
COMMENT ON COLUMN items.subsection_id IS 'Optional reference to subsection. Can be NULL for general questions not tied to a specific subsection.';
COMMENT ON COLUMN items.evidence_files IS 'Array of URLs to evidence files uploaded for this question';

-- 4. Verify the changes
SELECT 
  'Items table updated successfully' as status,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'items' 
  AND table_schema = 'public'
  AND column_name IN ('subsection_id', 'evidence_files')
ORDER BY column_name;
