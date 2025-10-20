-- ============================================
-- SOLUCIÓN COMPLETA DE STORAGE
-- Este script arregla todo: bucket, políticas y permisos
-- ============================================

-- PASO 1: Limpiar políticas existentes que puedan causar conflictos
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND (policyname LIKE '%multimedia%' OR policyname LIKE '%upload%' OR policyname LIKE '%admin%file%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- PASO 2: Asegurar que el bucket existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'multimedia',
  'multimedia',
  true,
  104857600, -- 100MB en bytes
  ARRAY['video/mp4', 'application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) 
DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- PASO 3: Crear políticas con lógica simplificada
-- (Usar nombres completamente únicos para evitar conflictos)

-- Política INSERT: Solo admins pueden subir
CREATE POLICY "multimedia_storage_insert_policy" 
ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'multimedia' 
  AND auth.role() = 'authenticated'
  AND (
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  )
);

-- Política SELECT: Todos pueden ver (lectura pública)
CREATE POLICY "multimedia_storage_select_policy" 
ON storage.objects
FOR SELECT 
USING (bucket_id = 'multimedia');

-- Política UPDATE: Solo admins pueden actualizar
CREATE POLICY "multimedia_storage_update_policy" 
ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'multimedia' 
  AND auth.role() = 'authenticated'
  AND (
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  )
);

-- Política DELETE: Solo admins pueden eliminar
CREATE POLICY "multimedia_storage_delete_policy" 
ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'multimedia' 
  AND auth.role() = 'authenticated'
  AND (
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  )
);

-- PASO 4: Verificar que user_profiles tiene RLS habilitado
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- PASO 5: Asegurar que hay una política para que los usuarios puedan leer su propio perfil
-- (Necesario para que las políticas de storage funcionen)
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile" 
ON user_profiles
FOR SELECT 
USING (auth.uid() = id);

-- También permitir que cualquier usuario autenticado pueda verificar roles de otros
-- (Necesario para que las políticas de storage puedan verificar si alguien es admin)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON user_profiles;
CREATE POLICY "Authenticated users can view profiles" 
ON user_profiles
FOR SELECT 
USING (auth.role() = 'authenticated');

-- PASO 6: HACER ADMIN AL USUARIO CON EMAIL admin@admin.com
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'admin@admin.com';

-- PASO 7: Si tienes otro email, cámbialo aquí y descomenta:
-- UPDATE user_profiles SET role = 'admin' WHERE email = 'TU_EMAIL@ejemplo.com';

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Mostrar el bucket
SELECT 
  '✅ 1. BUCKET MULTIMEDIA' as paso,
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets 
WHERE id = 'multimedia';

-- Mostrar las políticas
SELECT 
  '✅ 2. POLÍTICAS DE STORAGE' as paso,
  policyname,
  cmd as operacion
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%multimedia_storage%'
ORDER BY cmd;

-- Mostrar políticas de user_profiles
SELECT 
  '✅ 3. POLÍTICAS DE USER_PROFILES' as paso,
  policyname,
  cmd as operacion
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles'
ORDER BY cmd;

-- Mostrar usuarios admin
SELECT 
  '✅ 4. USUARIOS ADMIN' as paso,
  email,
  role,
  full_name
FROM user_profiles
WHERE role = 'admin';

-- Mostrar tu usuario actual
SELECT 
  '✅ 5. TU USUARIO ACTUAL' as paso,
  id,
  email,
  role
FROM user_profiles
WHERE id = auth.uid();

