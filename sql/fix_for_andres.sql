-- ============================================
-- ARREGLO PARA andrestheran@outlook.com
-- Ejecuta esto estando logueado en Supabase
-- ============================================

-- 1. VER TU SESIÓN ACTUAL EN SUPABASE
SELECT 
  '1️⃣ TU SESIÓN EN SUPABASE' as info,
  auth.uid() as tu_user_id,
  auth.email() as tu_email;

-- 2. VER TODOS LOS USUARIOS
SELECT 
  '2️⃣ TODOS LOS USUARIOS' as info,
  email,
  role
FROM user_profiles
ORDER BY created_at;

-- ============================================
-- HACER ADMIN A AMBOS USUARIOS
-- ============================================

-- 3. Hacer admin a andrestheran@outlook.com (tu cuenta de Supabase)
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'andrestheran@outlook.com';

-- 4. Hacer admin a admin@admin.com (cuenta de la app)
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'admin@admin.com';

-- 5. Crear perfil para andrestheran si no existe
INSERT INTO user_profiles (id, email, role)
SELECT auth.uid(), auth.email(), 'admin'
WHERE auth.email() = 'andrestheran@outlook.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE email = 'andrestheran@outlook.com'
  );

-- ============================================
-- LIMPIAR Y CREAR POLÍTICAS DE STORAGE
-- ============================================

-- 6. Limpiar todas las políticas de storage anteriores
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- 7. Crear políticas de storage funcionales
CREATE POLICY "storage_multimedia_insert" 
ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'multimedia' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "storage_multimedia_select" 
ON storage.objects
FOR SELECT 
USING (bucket_id = 'multimedia');

CREATE POLICY "storage_multimedia_update" 
ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'multimedia' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "storage_multimedia_delete" 
ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'multimedia' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- 8. Arreglar políticas de user_profiles
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_read_profiles" ON user_profiles;

CREATE POLICY "authenticated_read_profiles" 
ON user_profiles
FOR SELECT 
USING (auth.role() = 'authenticated');

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- 9. Verificar usuarios admin
SELECT 
  '✅ USUARIOS ADMIN' as paso,
  email,
  role,
  CASE 
    WHEN role = 'admin' THEN '✅ Es ADMIN'
    ELSE '❌ NO es admin'
  END as estado
FROM user_profiles
WHERE email IN ('andrestheran@outlook.com', 'admin@admin.com')
ORDER BY email;

-- 10. Verificar políticas de storage
SELECT 
  '✅ POLÍTICAS STORAGE' as paso,
  COUNT(*) as cantidad_politicas,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ ' || COUNT(*)::text || ' políticas configuradas'
    ELSE '❌ Solo ' || COUNT(*)::text || ' políticas'
  END as estado
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE 'storage_multimedia%';

-- 11. Verificar bucket
SELECT 
  '✅ BUCKET' as paso,
  id,
  public,
  '✅ Bucket existe' as estado
FROM storage.buckets 
WHERE id = 'multimedia';

-- 12. Verificar tu sesión actual
SELECT 
  '✅ TU SESIÓN AHORA' as paso,
  up.email,
  up.role,
  CASE 
    WHEN up.role = 'admin' THEN '✅ Tienes permisos de admin'
    ELSE '❌ NO tienes permisos de admin'
  END as estado
FROM user_profiles up
WHERE up.id = auth.uid();

