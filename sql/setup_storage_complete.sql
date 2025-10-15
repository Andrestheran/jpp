-- Complete setup for Supabase Storage
-- This script creates the multimedia bucket and all necessary policies

-- 1. Create the multimedia bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'multimedia',
  'multimedia',
  true,
  104857600, -- 100MB in bytes
  ARRAY['video/mp4', 'application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create policies for the multimedia bucket

-- Policy for INSERT (upload files)
CREATE POLICY "Only admins can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'multimedia' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Policy for SELECT (view files)
CREATE POLICY "Anyone can view files" ON storage.objects
FOR SELECT USING (bucket_id = 'multimedia');

-- Policy for UPDATE (update files)
CREATE POLICY "Only admins can update files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'multimedia' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Policy for DELETE (delete files)
CREATE POLICY "Only admins can delete files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'multimedia' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- 3. Verify the setup
SELECT 
  'Bucket created successfully' as status,
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'multimedia';

-- 4. Show policies
SELECT 
  'Policies created successfully' as status,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%multimedia%';
