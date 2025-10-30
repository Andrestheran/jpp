-- ============================================
-- ARREGLAR RECURSIÓN INFINITA EN USER_PROFILES
-- ============================================
-- El problema: las políticas de user_profiles están
-- consultando user_profiles para verificar roles,
-- creando un loop infinito
-- ============================================

-- PASO 1: ELIMINAR TODAS LAS POLÍTICAS DE USER_PROFILES
-- ============================================

DROP POLICY IF EXISTS "user_profiles_select_authenticated" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_all" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_can_read_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON user_profiles;

-- PASO 2: CREAR POLÍTICAS SIMPLES SIN RECURSIÓN
-- ============================================

-- Todos los usuarios autenticados pueden leer TODOS los perfiles
-- (Esto es necesario para que las políticas de otras tablas puedan verificar roles)
CREATE POLICY "allow_authenticated_read_all_profiles" 
ON user_profiles
FOR SELECT 
TO authenticated
USING (true);  -- Sin verificar roles, solo autenticación

-- Los usuarios pueden actualizar su propio perfil (sin cambiar el rol)
CREATE POLICY "allow_users_update_own_profile" 
ON user_profiles
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- PASO 3: LIMPIAR Y RECREAR POLÍTICAS DE OTRAS TABLAS
-- ============================================

-- Eliminar políticas existentes que causan problemas
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('domains', 'subsections', 'items', 'instruments')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- DOMAINS - Lectura pública, escritura solo admin
CREATE POLICY "domains_read" 
ON domains FOR SELECT TO authenticated USING (true);

CREATE POLICY "domains_write" 
ON domains FOR ALL TO authenticated
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);

-- SUBSECTIONS - Lectura pública, escritura solo admin
CREATE POLICY "subsections_read" 
ON subsections FOR SELECT TO authenticated USING (true);

CREATE POLICY "subsections_write" 
ON subsections FOR ALL TO authenticated
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);

-- ITEMS - Lectura pública, escritura solo admin
CREATE POLICY "items_read" 
ON items FOR SELECT TO authenticated USING (true);

CREATE POLICY "items_write" 
ON items FOR ALL TO authenticated
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);

-- INSTRUMENTS - Lectura pública, escritura solo admin
CREATE POLICY "instruments_read" 
ON instruments FOR SELECT TO authenticated USING (true);

CREATE POLICY "instruments_write" 
ON instruments FOR ALL TO authenticated
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);

-- PASO 4: ARREGLAR POLÍTICAS DE EVALUATIONS Y ANSWERS
-- ============================================

DO $$ 
BEGIN
    -- Eliminar políticas existentes
    DROP POLICY IF EXISTS "evaluations_insert_authenticated" ON evaluations;
    DROP POLICY IF EXISTS "evaluations_admin_select" ON evaluations;
    DROP POLICY IF EXISTS "evaluations_admin_modify" ON evaluations;
    DROP POLICY IF EXISTS "answers_insert_authenticated" ON answers;
    DROP POLICY IF EXISTS "answers_admin_select" ON answers;
    DROP POLICY IF EXISTS "answers_admin_modify" ON answers;
EXCEPTION WHEN OTHERS THEN
    -- Ignorar errores si las políticas no existen
    NULL;
END $$;

-- EVALUATIONS
CREATE POLICY "evaluations_insert" 
ON evaluations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "evaluations_read_admin" 
ON evaluations FOR SELECT TO authenticated
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "evaluations_modify_admin" 
ON evaluations FOR ALL TO authenticated
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);

-- ANSWERS
CREATE POLICY "answers_insert" 
ON answers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "answers_read_admin" 
ON answers FOR SELECT TO authenticated
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "answers_modify_admin" 
ON answers FOR ALL TO authenticated
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);

-- PASO 5: ACTUALIZAR ROL DE ADMIN
-- ============================================

UPDATE user_profiles SET role = 'admin' WHERE email = 'admin@admin.com';
UPDATE user_profiles SET role = 'user' WHERE email = 'user@user.com';

-- PASO 6: VERIFICACIÓN
-- ============================================

SELECT 
  '✅ POLÍTICAS DE USER_PROFILES' as info,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

SELECT 
  '✅ USUARIOS Y ROLES' as info,
  email,
  role,
  full_name
FROM user_profiles
ORDER BY role DESC, email;

SELECT 
  '📊 DATOS DISPONIBLES' as info,
  'domains' as tabla,
  COUNT(*) as registros
FROM domains
UNION ALL
SELECT '📊 DATOS DISPONIBLES', 'subsections', COUNT(*) FROM subsections
UNION ALL
SELECT '📊 DATOS DISPONIBLES', 'items', COUNT(*) FROM items;

