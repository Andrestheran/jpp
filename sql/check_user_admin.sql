-- ============================================
-- VERIFICAR TU USUARIO Y PERMISOS
-- ============================================

-- 1. Ver tu sesión actual
SELECT 
  'Tu ID de usuario actual' as info,
  auth.uid() as user_id,
  auth.email() as email;

-- 2. Ver tu perfil completo
SELECT 
  'Tu perfil en user_profiles' as info,
  id,
  email,
  role,
  full_name,
  created_at
FROM user_profiles
WHERE id = auth.uid();

-- 3. Ver TODOS los usuarios (para comparar)
SELECT 
  'Todos los usuarios' as info,
  email,
  role,
  created_at
FROM user_profiles
ORDER BY created_at;

-- 4. SI NO APARECES COMO ADMIN, ejecuta esto (reemplaza el email):
-- UPDATE user_profiles SET role = 'admin' WHERE email = 'tu_email@ejemplo.com';

