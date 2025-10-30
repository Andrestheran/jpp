-- ============================================
-- VERIFICAR ESTADO DE USUARIOS
-- ============================================
-- Este script verifica si los usuarios están
-- confirmados y tienen los permisos correctos
-- ============================================

-- PASO 1: Ver usuarios en auth.users (tabla de autenticación)
SELECT 
  '🔐 USUARIOS EN AUTH' as info,
  email,
  confirmed_at,
  CASE 
    WHEN confirmed_at IS NOT NULL THEN '✅ Confirmado' 
    ELSE '❌ No confirmado' 
  END as estado_confirmacion,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY email;

-- PASO 2: Ver usuarios en user_profiles (tu tabla de perfiles)
SELECT 
  '👤 USUARIOS EN PERFILES' as info,
  email,
  role,
  full_name,
  created_at
FROM user_profiles
ORDER BY email;

-- PASO 3: Verificar que exista la relación entre auth.users y user_profiles
SELECT 
  '🔗 RELACIÓN AUTH <-> PROFILES' as info,
  au.email as auth_email,
  up.email as profile_email,
  up.role,
  CASE 
    WHEN au.confirmed_at IS NOT NULL THEN '✅ Email confirmado' 
    ELSE '⚠️ Email NO confirmado' 
  END as estado_email,
  CASE 
    WHEN up.id IS NOT NULL THEN '✅ Tiene perfil' 
    ELSE '❌ Sin perfil' 
  END as tiene_perfil
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
ORDER BY au.email;

-- PASO 4: Si hay usuarios sin confirmar, confirmarlos automáticamente
UPDATE auth.users 
SET confirmed_at = NOW(),
    email_confirmed_at = NOW()
WHERE confirmed_at IS NULL;

-- PASO 5: Verificar de nuevo
SELECT 
  '✅ ESTADO FINAL' as info,
  email,
  CASE 
    WHEN confirmed_at IS NOT NULL THEN '✅ Confirmado' 
    ELSE '❌ No confirmado' 
  END as confirmacion
FROM auth.users
ORDER BY email;

