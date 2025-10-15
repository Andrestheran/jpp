-- Fix storage policies to ensure they work correctly
-- Based on the existing schema

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Only admins can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update files" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete files" ON storage.objects;

-- Create comprehensive policies for multimedia bucket

-- Policy for INSERT (upload files) - Only admins
CREATE POLICY "Only admins can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'multimedia' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Policy for SELECT (view files) - Anyone can view
CREATE POLICY "Anyone can view files" ON storage.objects
FOR SELECT USING (bucket_id = 'multimedia');

-- Policy for UPDATE (update files) - Only admins
CREATE POLICY "Only admins can update files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'multimedia' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Policy for DELETE (delete files) - Only admins
CREATE POLICY "Only admins can delete files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'multimedia' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Verify bucket exists
SELECT 
  'Bucket status:' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'multimedia') 
    THEN 'multimedia bucket EXISTS' 
    ELSE 'multimedia bucket NOT FOUND' 
  END as status;

-- Show created policies
SELECT 
  'Storage policies created:' as info,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%multimedia%'
ORDER BY policyname;
