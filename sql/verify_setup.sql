-- Verify complete setup for multimedia functionality
-- Run this to check if everything is configured correctly

-- 1. Check if multimedia bucket exists
SELECT 
  '1. Bucket Status:' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'multimedia') 
    THEN '✅ multimedia bucket EXISTS' 
    ELSE '❌ multimedia bucket NOT FOUND' 
  END as status;

-- 2. Check bucket configuration
SELECT 
  '2. Bucket Config:' as check_type,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'multimedia';

-- 3. Check storage policies
SELECT 
  '3. Storage Policies:' as check_type,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%multimedia%'
ORDER BY policyname;

-- 4. Check items table structure
SELECT 
  '4. Items Table:' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'items' 
  AND table_schema = 'public'
  AND column_name IN ('subsection_id', 'evidence_files', 'requires_evidence')
ORDER BY column_name;

-- 5. Check user_profiles table
SELECT 
  '5. User Profiles:' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public'
  AND column_name IN ('id', 'email', 'role', 'full_name')
ORDER BY column_name;

-- 6. Check if admin user exists
SELECT 
  '6. Admin User:' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM user_profiles WHERE role = 'admin') 
    THEN '✅ Admin user EXISTS' 
    ELSE '❌ No admin user found' 
  END as status;

-- 7. Show admin users
SELECT 
  '7. Admin Users:' as check_type,
  email,
  role,
  full_name,
  created_at
FROM user_profiles 
WHERE role = 'admin'
ORDER BY created_at;
