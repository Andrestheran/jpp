-- ============================================
-- LIMPIEZA TOTAL Y RECREACIÓN DE POLÍTICAS RLS
-- ============================================
-- Este script elimina TODAS las políticas existentes
-- y las recrea desde cero de forma correcta
-- ============================================

-- PASO 1: ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- ============================================

-- Dominios
DROP POLICY IF EXISTS "Anyone can view domains" ON domains;
DROP POLICY IF EXISTS "Authenticated users can view domains" ON domains;
DROP POLICY IF EXISTS "Only admins can manage domains" ON domains;
DROP POLICY IF EXISTS "Admins can manage domains" ON domains;
DROP POLICY IF EXISTS "Users can view domains" ON domains;

-- Subsecciones
DROP POLICY IF EXISTS "Anyone can view subsections" ON subsections;
DROP POLICY IF EXISTS "Authenticated users can view subsections" ON subsections;
DROP POLICY IF EXISTS "Only admins can manage subsections" ON subsections;
DROP POLICY IF EXISTS "Admins can manage subsections" ON subsections;
DROP POLICY IF EXISTS "Users can view subsections" ON subsections;

-- Items
DROP POLICY IF EXISTS "Anyone can view items" ON items;
DROP POLICY IF EXISTS "Authenticated users can view items" ON items;
DROP POLICY IF EXISTS "Only admins can manage items" ON items;
DROP POLICY IF EXISTS "Admins can manage items" ON items;
DROP POLICY IF EXISTS "Users can view items" ON items;

-- Instruments
DROP POLICY IF EXISTS "Anyone can view instruments" ON instruments;
DROP POLICY IF EXISTS "Authenticated users can view instruments" ON instruments;
DROP POLICY IF EXISTS "Only admins can manage instruments" ON instruments;
DROP POLICY IF EXISTS "Admins can manage instruments" ON instruments;
DROP POLICY IF EXISTS "Users can view instruments" ON instruments;

-- Evaluations
DROP POLICY IF EXISTS "Users can insert evaluations" ON evaluations;
DROP POLICY IF EXISTS "Admins can view all evaluations" ON evaluations;
DROP POLICY IF EXISTS "Users can view own evaluations" ON evaluations;

-- Answers
DROP POLICY IF EXISTS "Users can insert answers" ON answers;
DROP POLICY IF EXISTS "Admins can view all answers" ON answers;
DROP POLICY IF EXISTS "Users can view own answers" ON answers;

-- PASO 2: HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================

ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsections ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- PASO 3: CREAR POLÍTICAS SIMPLES Y CLARAS
-- ============================================

-- DOMAINS: Todos pueden leer, solo admin puede modificar
CREATE POLICY "domains_select_all" 
ON domains
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "domains_admin_all" 
ON domains
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- SUBSECTIONS: Todos pueden leer, solo admin puede modificar
CREATE POLICY "subsections_select_all" 
ON subsections
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "subsections_admin_all" 
ON subsections
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- ITEMS: Todos pueden leer, solo admin puede modificar
CREATE POLICY "items_select_all" 
ON items
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "items_admin_all" 
ON items
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- INSTRUMENTS: Todos pueden leer, solo admin puede modificar
CREATE POLICY "instruments_select_all" 
ON instruments
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "instruments_admin_all" 
ON instruments
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- EVALUATIONS: Todos pueden insertar, solo admin puede ver todas
CREATE POLICY "evaluations_insert_all" 
ON evaluations
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "evaluations_admin_select" 
ON evaluations
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "evaluations_admin_all" 
ON evaluations
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- ANSWERS: Todos pueden insertar, solo admin puede ver todas
CREATE POLICY "answers_insert_all" 
ON answers
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "answers_admin_select" 
ON answers
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "answers_admin_all" 
ON answers
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- PASO 4: ASEGURAR QUE USER_PROFILES TIENE POLÍTICAS
-- ============================================

-- Permitir que usuarios autenticados lean perfiles (necesario para las políticas arriba)
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON user_profiles;

CREATE POLICY "authenticated_can_read_profiles" 
ON user_profiles
FOR SELECT 
TO authenticated
USING (true);

-- PASO 5: VERIFICACIÓN
-- ============================================

-- Mostrar políticas creadas
SELECT 
  '✅ POLÍTICAS CREADAS' as status,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename IN ('domains', 'subsections', 'items', 'instruments', 'evaluations', 'answers')
ORDER BY tablename, policyname;

-- Verificar RLS habilitado
SELECT 
  '✅ RLS HABILITADO' as status,
  tablename,
  rowsecurity as enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('domains', 'subsections', 'items', 'instruments', 'evaluations', 'answers')
ORDER BY tablename;

-- Contar datos
SELECT 
  '✅ DATOS DISPONIBLES' as status,
  'domains' as table_name,
  COUNT(*) as records
FROM domains
UNION ALL
SELECT '✅ DATOS DISPONIBLES', 'subsections', COUNT(*) FROM subsections
UNION ALL
SELECT '✅ DATOS DISPONIBLES', 'items', COUNT(*) FROM items;

