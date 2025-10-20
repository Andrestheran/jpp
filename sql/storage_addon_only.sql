-- ============================================
-- AGREGAR ESTO AL FINAL DE TU SQL PRINCIPAL
-- Solo las partes necesarias para arreglar storage
-- ============================================

-- 1. Limpiar políticas conflictivas de storage
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

-- 2. Crear políticas de storage con lógica correcta
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

CREATE POLICY "multimedia_storage_select_policy" 
ON storage.objects
FOR SELECT 
USING (bucket_id = 'multimedia');

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

-- 3. Asegurar que user_profiles tiene políticas para lectura
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON user_profiles;
CREATE POLICY "Authenticated users can view profiles" 
ON user_profiles
FOR SELECT 
USING (auth.role() = 'authenticated');

-- 4. Hacer admin a tu usuario (CAMBIA EL EMAIL)
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'admin@admin.com';  -- ⚠️ CAMBIA ESTO si usas otro email

