-- Make subsection_id optional in items table
ALTER TABLE items ALTER COLUMN subsection_id DROP NOT NULL;

-- Add comment to explain the change
COMMENT ON COLUMN items.subsection_id IS 'Optional reference to subsection. Can be NULL for general questions not tied to a specific subsection.';
