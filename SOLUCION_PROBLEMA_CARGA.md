# 🔧 Solución al Problema de Carga Infinita

## 📋 Problema Identificado

El sistema se quedaba cargando infinitamente después del login porque:

1. **Race condition** en el manejo de sesiones
2. **Doble carga de perfil de usuario** causando bloqueos
3. **Falta de timeouts** en las consultas a la base de datos
4. **Políticas RLS faltantes** en las tablas de dominios, subsecciones e items

## ✅ Soluciones Implementadas

### 1. Mejoras en el Código (Ya Aplicadas)

#### **AuthContext.tsx**
- ✅ Agregado timeout de 5 segundos para evitar carga infinita
- ✅ Manejo de `isMounted` para evitar memory leaks
- ✅ Try-catch en todas las operaciones asíncronas
- ✅ Logs de depuración mejorados
- ✅ Eliminada la doble carga de perfil

#### **lib/auth.ts**
- ✅ Configuración explícita de Supabase con `autoRefreshToken` y `persistSession`
- ✅ Nueva función `clearCorruptedSession()` para limpiar sesiones dañadas
- ✅ Manejo de errores mejorado en `getUserProfile`

#### **data/instrument.ts**
- ✅ Agregado timeout de 5 segundos a cada consulta SQL
- ✅ Función helper `withTimeout` para control de timeouts
- ✅ Mejor manejo de errores y logging

#### **LoginForm.tsx**
- ✅ Nuevo botón "Limpiar sesión y reintentar" para autoayuda
- ✅ Función `handleClearSession` para limpiar localStorage

### 2. **IMPORTANTE: Ejecutar Script SQL en Supabase**

Las tablas `domains`, `subsections`, `items`, etc. necesitan políticas RLS para que los usuarios puedan leerlas.

#### **Pasos para ejecutar el script:**

1. **Abre Supabase Dashboard**
   - Ve a tu proyecto en [https://app.supabase.com](https://app.supabase.com)

2. **Ve a SQL Editor**
   - En el menú lateral, haz clic en "SQL Editor"

3. **Ejecuta el script**
   - Copia todo el contenido del archivo: `sql/fix_public_tables_rls.sql`
   - Pégalo en el editor SQL
   - Haz clic en "Run" o presiona `Ctrl+Enter`

4. **Verifica los resultados**
   - Al final del script verás dos tablas de verificación:
     - ✅ POLÍTICAS CREADAS: Lista de todas las políticas creadas
     - ✅ RLS STATUS: Confirmación de que RLS está habilitado

#### **¿Qué hace este script?**

El script `fix_public_tables_rls.sql`:
- ✅ Habilita RLS en todas las tablas necesarias
- ✅ Permite a usuarios autenticados **leer** dominios, subsecciones, items e instrumentos
- ✅ Permite a usuarios autenticados **insertar** evaluaciones y respuestas
- ✅ Solo permite a **administradores** crear/editar/eliminar dominios, subsecciones e items
- ✅ Solo permite a **administradores** ver todas las evaluaciones y respuestas

## 🎯 Resultado Esperado

Después de aplicar estas soluciones:

### ✅ Antes de ejecutar el SQL:
- El sistema se queda cargando después del login
- Timeout warnings en la consola
- "Loading domains from database..." sin respuesta

### ✅ Después de ejecutar el SQL:
- Login exitoso en 1-2 segundos
- Carga de preguntas rápida y fluida
- Sin timeouts ni warnings
- Console mostrará:
  ```
  🔐 Auth state change: SIGNED_IN
  🔄 Loading domains from database...
  ✅ Domains loaded: X
  ✅ Subsections loaded: Y
  ✅ Items loaded: Z
  ✅ Domains loaded successfully: X
  ```

## 🆘 Si Aún Tienes Problemas

### Opción 1: Usar el botón de ayuda
En la pantalla de login, haz clic en **"Limpiar sesión y reintentar"**

### Opción 2: Limpiar manualmente
1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Application" o "Almacenamiento"
3. Busca "Local Storage"
4. Elimina todas las entradas que empiecen con `sb-`
5. Recarga la página

### Opción 3: Verificar permisos en Supabase
Asegúrate de que:
1. Tu usuario existe en la tabla `user_profiles`
2. Tu usuario tiene un `role` asignado ('admin' o 'user')
3. Las políticas RLS están activas (ejecuta el script SQL)

## 📊 Logs de Depuración

Los logs en la consola te ayudarán a identificar problemas:

| Log | Significado |
|-----|-------------|
| `🔐 Auth state change: SIGNED_IN` | Login exitoso |
| `🔄 Loading domains from database...` | Iniciando carga de preguntas |
| `✅ Domains loaded: X` | Dominios cargados correctamente |
| `⚠️ Auth loading timeout` | Timeout alcanzado (recuperable) |
| `❌ Error loading domains` | Error en la carga (revisar permisos SQL) |
| `📦 Using cached domains` | Usando caché (más rápido) |

## 🔍 Verificar en Supabase

Para verificar que todo está bien:

```sql
-- Ver las políticas de RLS
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('domains', 'subsections', 'items')
ORDER BY tablename;

-- Ver si RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('domains', 'subsections', 'items');
```

## 📞 Contacto

Si después de seguir estos pasos sigues teniendo problemas, revisa:
1. Los logs de la consola del navegador
2. Los logs de Supabase (Dashboard > Logs)
3. Las políticas RLS en Supabase (Dashboard > Authentication > Policies)

