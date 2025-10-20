-- ============================================
-- FIX STORAGE MULTIMEDIA BUCKET
-- Este script elimina y recrea todo lo relacionado al bucket multimedia
-- ============================================

-- 1. Eliminar todas las políticas existentes para el bucket multimedia
DROP POLICY IF EXISTS "Only admins can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update files" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete files" ON storage.objects;

-- También eliminar posibles variaciones de nombres
DROP POLICY IF EXISTS "Admin upload multimedia" ON storage.objects;
DROP POLICY IF EXISTS "Public read multimedia" ON storage.objects;
DROP POLICY IF EXISTS "Admin update multimedia" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete multimedia" ON storage.objects;

-- 2. Eliminar el bucket si existe (esto también eliminará todos los archivos)
DELETE FROM storage.buckets WHERE id = 'multimedia';

-- 3. Crear el bucket multimedia de nuevo
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'multimedia',
  'multimedia',
  true,
  104857600, -- 100MB en bytes
  ARRAY['video/mp4', 'application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
);

-- 4. Crear políticas de acceso con nombres únicos y claros

-- Política de INSERT (subir archivos) - Solo admins
CREATE POLICY "multimedia_admin_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'multimedia' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Política de SELECT (ver archivos) - Público
CREATE POLICY "multimedia_public_select" ON storage.objects
FOR SELECT USING (bucket_id = 'multimedia');

-- Política de UPDATE (actualizar archivos) - Solo admins
CREATE POLICY "multimedia_admin_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'multimedia' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Política de DELETE (eliminar archivos) - Solo admins
CREATE POLICY "multimedia_admin_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'multimedia' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- 5. Verificar que todo se creó correctamente
SELECT 
  '✅ Bucket Multimedia' as component,
  id, 
  name, 
  public,
  file_size_limit,
  array_length(allowed_mime_types, 1) as mime_types_count
FROM storage.buckets 
WHERE id = 'multimedia';

-- 6. Verificar políticas
SELECT 
  '✅ Políticas Storage' as component,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE 'multimedia%'
ORDER BY cmd;

-- 7. Verificar que tu usuario es admin
SELECT 
  '✅ Tu Perfil de Usuario' as component,
  email,
  role,
  id
FROM user_profiles 
WHERE id = auth.uid();

