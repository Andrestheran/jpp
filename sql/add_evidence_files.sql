-- Add evidence_files column to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS evidence_files TEXT[];

-- Add comment to explain the column
COMMENT ON COLUMN items.evidence_files IS 'Array of URLs to evidence files uploaded for this question';
