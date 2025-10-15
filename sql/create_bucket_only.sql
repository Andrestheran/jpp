-- Simple script to create only the multimedia bucket
-- This avoids policy conflicts

-- Create the multimedia bucket (ignore if exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'multimedia',
  'multimedia',
  true,
  104857600, -- 100MB in bytes
  ARRAY['video/mp4', 'application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Verify bucket was created
SELECT 
  'Bucket multimedia created successfully' as status,
  id, 
  name, 
  public, 
  file_size_limit
FROM storage.buckets 
WHERE id = 'multimedia';
