-- ============================================
-- VERIFICAR Y ARREGLAR ROLES DE USUARIOS
-- ============================================

-- PASO 1: Ver los usuarios actuales y sus roles
SELECT 
  '👥 USUARIOS ACTUALES' as info,
  email,
  role,
  full_name,
  created_at
FROM user_profiles
ORDER BY email;

-- PASO 2: Actualizar el rol de admin@admin.com a 'admin'
UPDATE user_profiles 
SET role = 'admin'
WHERE email = 'admin@admin.com';

-- PASO 3: Asegurarse de que user@user.com sea 'user'
UPDATE user_profiles 
SET role = 'user'
WHERE email = 'user@user.com';

-- PASO 4: Verificar los cambios
SELECT 
  '✅ ROLES ACTUALIZADOS' as info,
  email,
  role,
  full_name
FROM user_profiles
ORDER BY role DESC, email;

-- PASO 5: Si tu admin tiene otro email, descomenta y modifica esta línea:
-- UPDATE user_profiles SET role = 'admin' WHERE email = 'tu_email@ejemplo.com';

