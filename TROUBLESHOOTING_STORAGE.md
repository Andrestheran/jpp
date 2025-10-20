# Solución de Problemas: Storage "Bucket Multimedia"

## El Problema
Estás recibiendo el error: `El bucket "multimedia" no existe`

## Solución Paso a Paso

### 🚀 SOLUCIÓN RÁPIDA (Recomendada)

**Si tienes el error de permisos, ejecuta esto primero:**

En tu Supabase SQL Editor, ejecuta todo el contenido de:
```
sql/complete_storage_fix.sql
```

Este script hace TODO automáticamente:
- ✅ Limpia políticas conflictivas
- ✅ Crea/actualiza el bucket multimedia
- ✅ Configura las 4 políticas correctamente
- ✅ Arregla las políticas de user_profiles (necesario para que las otras funcionen)
- ✅ Te hace admin si usas admin@admin.com
- ✅ Verifica que todo esté correcto

⚠️ **IMPORTANTE**: Si tu email NO es `admin@admin.com`, edita la línea 91 del script antes de ejecutarlo:
```sql
UPDATE user_profiles SET role = 'admin' WHERE email = 'TU_EMAIL@ejemplo.com';
```

---

### 🔍 Diagnóstico Detallado (Opcional)

Si quieres entender qué está mal antes de arreglarlo:

#### Paso 1: Verificar el Estado Actual
Ejecuta el contenido de `sql/verify_bucket.sql`

Este script te mostrará:
- ✅ o ❌ Si el bucket existe
- ✅ o ❌ Si las políticas están configuradas
- ✅ o ❌ Si tu usuario es admin

#### Paso 2: Verificar tu Usuario
Ejecuta el contenido de `sql/check_user_admin.sql`

Esto te muestra:
- Tu ID de usuario actual
- Tu rol (admin o user)
- Todos los usuarios del sistema

#### Paso 3: Aplicar la Solución
Ejecuta `sql/complete_storage_fix.sql` (ver arriba)

#### Paso 4: Verificar de Nuevo
El script `complete_storage_fix.sql` muestra la verificación automáticamente al final.
Si quieres verificar de nuevo después, ejecuta `verify_bucket.sql`

### Paso 5: Probar en la Aplicación
1. Ve a `/admin/preguntas` en tu aplicación
2. Crea una nueva pregunta
3. Marca "Requiere evidencia"
4. Arrastra un archivo
5. Envía el formulario

## Errores Comunes y Soluciones

### Error: "Bucket not found"
**Causa**: El bucket no existe en Supabase
**Solución**: Ejecuta `complete_storage_fix.sql` 

### Error: "Permission denied" o "No tienes permisos para subir archivos"
**Causa**: Las políticas RLS no están configuradas correctamente o tu usuario no es admin
**Solución**: 
1. Ejecuta `complete_storage_fix.sql` (arregla políticas Y hace tu usuario admin)
2. Asegúrate de cambiar el email en el script si no usas admin@admin.com

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

## Archivos Creados/Modificados

- ✅ `app/admin/preguntas/page.tsx` - Función de upload mejorada (sin check de bucket)
- ✅ `sql/complete_storage_fix.sql` - **Script principal: Arregla todo automáticamente**
- ✅ `sql/verify_bucket.sql` - Script de verificación diagnóstica
- ✅ `sql/check_user_admin.sql` - Verifica tu rol de usuario
- ✅ `sql/fix_storage_multimedia.sql` - Script de corrección alternativo
- ✅ `TROUBLESHOOTING_STORAGE.md` - Esta guía completa

