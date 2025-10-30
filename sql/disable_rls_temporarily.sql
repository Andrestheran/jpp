-- ============================================
-- DESACTIVAR RLS TEMPORALMENTE PARA PRUEBAS
-- ============================================
-- ADVERTENCIA: Esto hace que las tablas sean públicas
-- Solo úsalo para confirmar que el problema son las políticas
-- ============================================

-- Desactivar RLS en las tablas de datos (lectura pública)
ALTER TABLE domains DISABLE ROW LEVEL SECURITY;
ALTER TABLE subsections DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE instruments DISABLE ROW LEVEL SECURITY;

-- Mantener RLS en tablas sensibles
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Verificar
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '🔒 RLS Activo' 
    ELSE '🔓 RLS Desactivado' 
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('domains', 'subsections', 'items', 'instruments', 'evaluations', 'answers', 'user_profiles')
ORDER BY tablename;

