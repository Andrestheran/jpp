-- Safe setup for Supabase Storage
-- This script handles existing policies and buckets gracefully

-- 1. Create the multimedia bucket (ignore if exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'multimedia',
  'multimedia',
  true,
  104857600, -- 100MB in bytes
  ARRAY['video/mp4', 'application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Only admins can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update files" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete files" ON storage.objects;

-- 3. Create policies for the multimedia bucket

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

-- 4. Verify the setup
SELECT 
  'Bucket multimedia status:' as info,
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'multimedia';

-- 5. Show created policies
SELECT 
  'Storage policies created:' as info,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%multimedia%';
