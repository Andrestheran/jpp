# Solución de Problemas: Storage "Bucket Multimedia"

## El Problema
Estás recibiendo el error: `El bucket "multimedia" no existe`

## Solución Paso a Paso

### Paso 1: Verificar el Estado Actual
En tu consola de Supabase, ve a **SQL Editor** y ejecuta:

```sql
-- Archivo: sql/verify_bucket.sql
```

Este script te mostrará:
- ✅ o ❌ Si el bucket existe
- ✅ o ❌ Si las políticas están configuradas
- ✅ o ❌ Si tu usuario es admin

### Paso 2: Interpretar los Resultados

#### Caso A: El bucket NO existe
Si ves `❌ El bucket multimedia NO EXISTE`, ejecuta:

```sql
-- Archivo: sql/fix_storage_multimedia.sql
```

Este script:
1. Elimina cualquier configuración corrupta
2. Crea el bucket `multimedia` correctamente
3. Configura las 4 políticas necesarias
4. Verifica que todo funcione

#### Caso B: El bucket existe pero las políticas están mal
Si ves `⚠️ Políticas incompletas`, también ejecuta `fix_storage_multimedia.sql`

#### Caso C: No eres admin
Si ves `❌ Eres user - NECESITAS ser admin`, ejecuta:

```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'tu_email@ejemplo.com';
```

Reemplaza `tu_email@ejemplo.com` con tu email real.

### Paso 3: Verificar de Nuevo
Después de ejecutar el fix, vuelve a ejecutar `verify_bucket.sql` para confirmar que todo está ✅

### Paso 4: Probar en la Aplicación
1. Ve a `/admin/preguntas` en tu aplicación
2. Crea una nueva pregunta
3. Marca "Requiere evidencia"
4. Arrastra un archivo
5. Envía el formulario

## Errores Comunes y Soluciones

### Error: "Bucket not found"
**Causa**: El bucket no existe en Supabase
**Solución**: Ejecuta `fix_storage_multimedia.sql`

### Error: "Permission denied" o "policy"
**Causa**: Las políticas RLS no están configuradas o tu usuario no es admin
**Solución**: 
1. Ejecuta `fix_storage_multimedia.sql` para recrear las políticas
2. Verifica que eres admin con `verify_bucket.sql`

### Error: "File too large"
**Causa**: El archivo supera 50MB
**Solución**: Usa un archivo más pequeño o aumenta el límite en el SQL

## Cambios en el Código

Ya he actualizado el código en `app/admin/preguntas/page.tsx` para:
- ✅ Eliminar la verificación problemática de `listBuckets()`
- ✅ Intentar subir directamente
- ✅ Mostrar mensajes de error más claros
- ✅ Incluir información de depuración en la consola

## Verificación Manual en Supabase

También puedes verificar manualmente en la interfaz de Supabase:

1. Ve a **Storage** en el menú lateral
2. Deberías ver un bucket llamado `multimedia`
3. Haz clic en él
4. Debería estar vacío (o con archivos si ya subiste algunos)
5. Ve a **Policies** (dentro de Storage)
6. Deberías ver 4 políticas para `multimedia`:
   - `multimedia_admin_insert` (INSERT)
   - `multimedia_public_select` (SELECT)
   - `multimedia_admin_update` (UPDATE)
   - `multimedia_admin_delete` (DELETE)

## ¿Aún no Funciona?

Si después de seguir todos estos pasos aún tienes problemas:

1. Revisa la consola del navegador (F12) para ver el error exacto
2. Copia el mensaje de error completo
3. Verifica que estás usando las credenciales correctas (`.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Archivos Modificados

- ✅ `app/admin/preguntas/page.tsx` - Función de upload mejorada
- ✅ `sql/verify_bucket.sql` - Script de verificación
- ✅ `sql/fix_storage_multimedia.sql` - Script de corrección
- ✅ `TROUBLESHOOTING_STORAGE.md` - Esta guía

