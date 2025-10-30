-- ============================================
-- ⚡ SOLUCIÓN DE EMERGENCIA - EJECÚTALA YA ⚡
-- ============================================
-- Este script desactiva RLS en tablas de lectura pública
-- y mantiene seguridad solo en las tablas críticas
-- ============================================

-- PASO 1: DESACTIVAR RLS EN TABLAS DE DATOS (lectura pública es OK)
ALTER TABLE domains DISABLE ROW LEVEL SECURITY;
ALTER TABLE subsections DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE instruments DISABLE ROW LEVEL SECURITY;

-- PASO 2: MANTENER RLS ACTIVO SOLO EN TABLAS SENSIBLES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- PASO 3: LIMPIAR POLÍTICAS DE USER_PROFILES (evitar recursión)
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'user_profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles', pol.policyname);
    END LOOP;
END $$;

-- PASO 4: CREAR POLÍTICA SIMPLE PARA USER_PROFILES (sin recursión)
CREATE POLICY "allow_all_read_profiles" 
ON user_profiles
FOR SELECT 
USING (true);

CREATE POLICY "allow_users_update_own" 
ON user_profiles
FOR UPDATE 
USING (auth.uid() = id);

-- PASO 5: POLÍTICAS SIMPLES PARA EVALUATIONS
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "evaluations_insert" ON evaluations;
    DROP POLICY IF EXISTS "evaluations_read_admin" ON evaluations;
    DROP POLICY IF EXISTS "evaluations_modify_admin" ON evaluations;
    DROP POLICY IF EXISTS "evaluations_insert_authenticated" ON evaluations;
    DROP POLICY IF EXISTS "evaluations_admin_select" ON evaluations;
    DROP POLICY IF EXISTS "evaluations_admin_modify" ON evaluations;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

CREATE POLICY "eval_insert" ON evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY "eval_admin_all" ON evaluations FOR ALL 
USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- PASO 6: POLÍTICAS SIMPLES PARA ANSWERS
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "answers_insert" ON answers;
    DROP POLICY IF EXISTS "answers_read_admin" ON answers;
    DROP POLICY IF EXISTS "answers_modify_admin" ON answers;
    DROP POLICY IF EXISTS "answers_insert_authenticated" ON answers;
    DROP POLICY IF EXISTS "answers_admin_select" ON answers;
    DROP POLICY IF EXISTS "answers_admin_modify" ON answers;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

CREATE POLICY "ans_insert" ON answers FOR INSERT WITH CHECK (true);
CREATE POLICY "ans_admin_all" ON answers FOR ALL 
USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- PASO 7: ACTUALIZAR ROLES
UPDATE user_profiles SET role = 'admin' WHERE email = 'admin@admin.com';
UPDATE user_profiles SET role = 'user' WHERE email = 'user@user.com';

-- PASO 8: VERIFICACIÓN FINAL
SELECT 
  '✅ ESTADO RLS' as info,
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 Activo' 
    ELSE '🔓 Desactivado (lectura pública)' 
  END as estado
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('domains', 'subsections', 'items', 'instruments', 'user_profiles', 'evaluations', 'answers')
ORDER BY tablename;

SELECT 
  '👥 USUARIOS' as info,
  email,
  role
FROM user_profiles
ORDER BY role DESC;

SELECT 
  '📊 DATOS' as info,
  'Dominios' as tipo,
  COUNT(*) as cantidad
FROM domains
UNION ALL
SELECT '📊 DATOS', 'Subsecciones', COUNT(*) FROM subsections
UNION ALL
SELECT '📊 DATOS', 'Items/Preguntas', COUNT(*) FROM items;

