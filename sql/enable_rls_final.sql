-- ============================================
-- ACTIVAR RLS DE FORMA CORRECTA Y FINAL
-- ============================================
-- Este script reactiva RLS con políticas optimizadas
-- ============================================

-- PASO 1: LIMPIAR TODAS LAS POLÍTICAS ANTERIORES
-- ============================================

DO $$ 
DECLARE
    pol record;
BEGIN
    -- Eliminar todas las políticas de las tablas principales
    FOR pol IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('domains', 'subsections', 'items', 'instruments', 'evaluations', 'answers', 'user_profiles')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- PASO 2: HABILITAR RLS
-- ============================================

ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsections ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- PASO 3: POLÍTICAS PARA USER_PROFILES (IMPORTANTE - PRIMERO)
-- ============================================
-- Esto es necesario para que las otras políticas puedan verificar roles

CREATE POLICY "user_profiles_select_authenticated" 
ON user_profiles
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "user_profiles_update_own" 
ON user_profiles
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "user_profiles_admin_all" 
ON user_profiles
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- PASO 4: POLÍTICAS PARA DATOS (LECTURA PÚBLICA)
-- ============================================

-- DOMAINS
CREATE POLICY "domains_select_authenticated" 
ON domains FOR SELECT TO authenticated USING (true);

CREATE POLICY "domains_admin_modify" 
ON domains FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- SUBSECTIONS
CREATE POLICY "subsections_select_authenticated" 
ON subsections FOR SELECT TO authenticated USING (true);

CREATE POLICY "subsections_admin_modify" 
ON subsections FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ITEMS
CREATE POLICY "items_select_authenticated" 
ON items FOR SELECT TO authenticated USING (true);

CREATE POLICY "items_admin_modify" 
ON items FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- INSTRUMENTS
CREATE POLICY "instruments_select_authenticated" 
ON instruments FOR SELECT TO authenticated USING (true);

CREATE POLICY "instruments_admin_modify" 
ON instruments FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- PASO 5: POLÍTICAS PARA EVALUACIONES Y RESPUESTAS
-- ============================================

-- EVALUATIONS - Todos pueden crear, solo admin puede ver todas
CREATE POLICY "evaluations_insert_authenticated" 
ON evaluations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "evaluations_admin_select" 
ON evaluations FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "evaluations_admin_modify" 
ON evaluations FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ANSWERS - Todos pueden crear, solo admin puede ver todas
CREATE POLICY "answers_insert_authenticated" 
ON answers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "answers_admin_select" 
ON answers FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "answers_admin_modify" 
ON answers FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- PASO 6: VERIFICACIÓN FINAL
-- ============================================

-- Ver políticas creadas
SELECT 
  '✅ POLÍTICAS RLS ACTIVAS' as status,
  tablename,
  COUNT(*) as num_policies
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('domains', 'subsections', 'items', 'instruments', 'evaluations', 'answers', 'user_profiles')
GROUP BY tablename
ORDER BY tablename;

-- Ver estado RLS
SELECT 
  '✅ RLS HABILITADO' as status,
  tablename,
  CASE WHEN rowsecurity THEN '🔒 Activo' ELSE '⚠️ Inactivo' END as estado
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('domains', 'subsections', 'items', 'instruments', 'evaluations', 'answers', 'user_profiles')
ORDER BY tablename;

-- Contar datos
SELECT 
  '📊 DATOS EN TABLAS' as status,
  'domains' as tabla,
  COUNT(*) as registros
FROM domains
UNION ALL
SELECT '📊 DATOS EN TABLAS', 'subsections', COUNT(*) FROM subsections
UNION ALL
SELECT '📊 DATOS EN TABLAS', 'items', COUNT(*) FROM items
UNION ALL
SELECT '📊 DATOS EN TABLAS', 'user_profiles', COUNT(*) FROM user_profiles;

-- Ver usuarios
SELECT 
  '👥 USUARIOS REGISTRADOS' as status,
  email,
  role,
  full_name
FROM user_profiles
ORDER BY role DESC, email;

