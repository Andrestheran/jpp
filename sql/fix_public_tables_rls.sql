-- ============================================
-- FIX: Políticas RLS para tablas públicas de lectura
-- ============================================
-- Este script permite que los usuarios autenticados puedan leer
-- las tablas de dominios, subsecciones e items

-- Habilitar RLS en las tablas si no está habilitado
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsections ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA DOMAINS
-- ============================================

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Anyone can view domains" ON domains;
DROP POLICY IF EXISTS "Authenticated users can view domains" ON domains;
DROP POLICY IF EXISTS "Only admins can manage domains" ON domains;

-- Permitir a todos los usuarios autenticados leer dominios
CREATE POLICY "Authenticated users can view domains" 
ON domains
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Solo admins pueden insertar/actualizar/eliminar dominios
CREATE POLICY "Only admins can manage domains" 
ON domains
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- ============================================
-- POLÍTICAS PARA SUBSECTIONS
-- ============================================

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Anyone can view subsections" ON subsections;
DROP POLICY IF EXISTS "Authenticated users can view subsections" ON subsections;
DROP POLICY IF EXISTS "Only admins can manage subsections" ON subsections;

-- Permitir a todos los usuarios autenticados leer subsecciones
CREATE POLICY "Authenticated users can view subsections" 
ON subsections
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Solo admins pueden insertar/actualizar/eliminar subsecciones
CREATE POLICY "Only admins can manage subsections" 
ON subsections
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- ============================================
-- POLÍTICAS PARA ITEMS
-- ============================================

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Anyone can view items" ON items;
DROP POLICY IF EXISTS "Authenticated users can view items" ON items;
DROP POLICY IF EXISTS "Only admins can manage items" ON items;

-- Permitir a todos los usuarios autenticados leer items
CREATE POLICY "Authenticated users can view items" 
ON items
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Solo admins pueden insertar/actualizar/eliminar items
CREATE POLICY "Only admins can manage items" 
ON items
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- ============================================
-- POLÍTICAS PARA INSTRUMENTS
-- ============================================

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Anyone can view instruments" ON instruments;
DROP POLICY IF EXISTS "Authenticated users can view instruments" ON instruments;
DROP POLICY IF EXISTS "Only admins can manage instruments" ON instruments;

-- Permitir a todos los usuarios autenticados leer instrumentos
CREATE POLICY "Authenticated users can view instruments" 
ON instruments
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Solo admins pueden insertar/actualizar/eliminar instrumentos
CREATE POLICY "Only admins can manage instruments" 
ON instruments
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- ============================================
-- POLÍTICAS PARA EVALUATIONS
-- ============================================

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can insert evaluations" ON evaluations;
DROP POLICY IF EXISTS "Admins can view all evaluations" ON evaluations;
DROP POLICY IF EXISTS "Users can view own evaluations" ON evaluations;

-- Usuarios autenticados pueden insertar evaluaciones
CREATE POLICY "Users can insert evaluations" 
ON evaluations
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Admins pueden ver todas las evaluaciones
CREATE POLICY "Admins can view all evaluations" 
ON evaluations
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- ============================================
-- POLÍTICAS PARA ANSWERS
-- ============================================

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can insert answers" ON answers;
DROP POLICY IF EXISTS "Admins can view all answers" ON answers;
DROP POLICY IF EXISTS "Users can view own answers" ON answers;

-- Usuarios autenticados pueden insertar respuestas
CREATE POLICY "Users can insert answers" 
ON answers
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Admins pueden ver todas las respuestas
CREATE POLICY "Admins can view all answers" 
ON answers
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver todas las políticas creadas
SELECT 
  '✅ POLÍTICAS CREADAS' as status,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('domains', 'subsections', 'items', 'instruments', 'evaluations', 'answers')
ORDER BY tablename, policyname;

-- Verificar que RLS está habilitado
SELECT 
  '✅ RLS STATUS' as status,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('domains', 'subsections', 'items', 'instruments', 'evaluations', 'answers')
ORDER BY tablename;

