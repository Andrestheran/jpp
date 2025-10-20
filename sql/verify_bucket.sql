-- ============================================
-- VERIFICAR CONFIGURACIÓN DE STORAGE
-- Ejecuta esto ANTES de intentar subir archivos
-- ============================================

-- 1. Verificar si el bucket multimedia existe
SELECT 
  '1️⃣ BUCKET' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ El bucket multimedia EXISTE'
    ELSE '❌ El bucket multimedia NO EXISTE - Ejecuta fix_storage_multimedia.sql'
  END as status,
  MAX(id) as bucket_id,
  MAX(public::text) as is_public,
  MAX(file_size_limit) as size_limit_bytes,
  MAX(array_length(allowed_mime_types, 1)) as mime_types_count
FROM storage.buckets 
WHERE id = 'multimedia';

-- 2. Verificar políticas de storage
SELECT 
  '2️⃣ POLÍTICAS' as check_type,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Políticas configuradas (' || COUNT(*)::text || ' políticas)'
    WHEN COUNT(*) > 0 THEN '⚠️  Políticas incompletas (' || COUNT(*)::text || ' de 4) - Ejecuta fix_storage_multimedia.sql'
    ELSE '❌ NO HAY POLÍTICAS - Ejecuta fix_storage_multimedia.sql'
  END as status
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (
    policyname LIKE '%multimedia%' 
    OR policyname LIKE '%upload%file%'
    OR policyname LIKE '%view%file%'
  );

-- 3. Verificar tu rol de usuario
SELECT 
  '3️⃣ TU USUARIO' as check_type,
  CASE 
    WHEN role = 'admin' THEN '✅ Eres ADMIN - Puedes subir archivos'
    ELSE '❌ Eres ' || role || ' - NECESITAS ser admin para subir archivos'
  END as status,
  email,
  role
FROM user_profiles 
WHERE id = auth.uid();

-- 4. Detalles de las políticas (para debug)
SELECT 
  '4️⃣ DETALLE POLÍTICAS' as check_type,
  policyname as policy_name,
  cmd as operation,
  permissive,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Lectura pública'
    WHEN cmd = 'INSERT' THEN '🔒 Solo admin puede insertar'
    WHEN cmd = 'UPDATE' THEN '🔒 Solo admin puede actualizar'
    WHEN cmd = 'DELETE' THEN '🔒 Solo admin puede eliminar'
  END as description
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (
    policyname LIKE '%multimedia%' 
    OR policyname LIKE '%upload%file%'
    OR policyname LIKE '%view%file%'
  )
ORDER BY cmd;

-- 5. Verificar si hay archivos en el bucket
SELECT 
  '5️⃣ ARCHIVOS' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '📁 Hay ' || COUNT(*)::text || ' archivo(s) en el bucket'
    ELSE '📭 El bucket está vacío (normal si es nuevo)'
  END as status
FROM storage.objects
WHERE bucket_id = 'multimedia';

