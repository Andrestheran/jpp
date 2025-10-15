-- Check existing policies to avoid conflicts

-- Check storage policies
SELECT 
  'Existing storage policies:' as info,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- Check user_profiles policies
SELECT 
  'Existing user_profiles policies:' as info,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'user_profiles' 
  AND schemaname = 'public'
ORDER BY policyname;

-- Check if multimedia bucket exists
SELECT 
  'Bucket status:' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'multimedia') 
    THEN 'multimedia bucket EXISTS' 
    ELSE 'multimedia bucket NOT FOUND' 
  END as status;
