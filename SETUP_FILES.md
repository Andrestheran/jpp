# Setup de Gestión de Archivos Multimedia

Este documento explica cómo configurar la funcionalidad de gestión de archivos multimedia para administradores.

## 1. Configuración de Base de Datos

Ejecuta el siguiente SQL en tu consola de Supabase para crear la tabla de archivos:

```sql
-- Ejecutar el contenido del archivo sql/files_storage.sql
```

O copia y pega el contenido de `sql/files_storage.sql` en el SQL Editor de Supabase.

## 2. Configuración de Storage en Supabase

### 2.1 Crear Bucket de Storage

1. Ve a tu proyecto de Supabase
2. Navega a **Storage** en el menú lateral
3. Haz clic en **New bucket**
4. Configura el bucket:
   - **Name**: `multimedia`
   - **Public**: ✅ (marcado para permitir acceso público a los archivos)
   - **File size limit**: `100MB` (o el límite que prefieras)
   - **Allowed MIME types**: 
     - `video/mp4`
     - `application/pdf`
     - `image/jpeg`
     - `image/jpg`
     - `image/png`

### 2.2 Configurar Políticas de Storage

Crea las siguientes políticas en el bucket `multimedia`:

#### Política de Inserción (INSERT)
```sql
CREATE POLICY "Only admins can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'multimedia' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);
```

#### Política de Lectura (SELECT)
```sql
CREATE POLICY "Anyone can view files" ON storage.objects
FOR SELECT USING (bucket_id = 'multimedia');
```

#### Política de Eliminación (DELETE)
```sql
CREATE POLICY "Only admins can delete files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'multimedia' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);
```

## 3. Funcionalidades Implementadas

### 3.1 Componente de Drag & Drop (`components/ui/file-upload.tsx`)

- **Soporte de archivos**: MP4, PDF, JPG, PNG
- **Validación de tipos**: Solo permite los tipos de archivo especificados
- **Validación de tamaño**: Límite configurable (por defecto 50MB)
- **Preview de imágenes**: Muestra vista previa de archivos de imagen
- **Indicadores visuales**: Iconos específicos para cada tipo de archivo
- **Gestión de errores**: Muestra errores de validación claramente

### 3.2 Página de Administración (`app/admin/files/page.tsx`)

- **Solo para administradores**: Protegida con `ProtectedRoute`
- **Subida de archivos**: Integración con Supabase Storage
- **Lista de archivos**: Muestra todos los archivos subidos
- **Acciones**: Ver, descargar y eliminar archivos
- **Metadatos**: Muestra nombre, tamaño, tipo y fecha de subida

### 3.3 Navegación de Admin (`app/admin/page.tsx`)

- **Panel principal**: Acceso rápido a gestión de usuarios y archivos
- **Tarjetas de navegación**: Interfaz intuitiva para acceder a diferentes secciones

## 4. Uso

### 4.1 Para Administradores

1. Inicia sesión como administrador
2. Ve a `/admin` para ver el panel principal
3. Haz clic en "Gestionar Archivos" o navega a `/admin/files`
4. Arrastra archivos al área de drop o haz clic en "Seleccionar archivos"
5. Haz clic en "Subir archivos" para cargar los archivos seleccionados
6. Gestiona los archivos subidos con las opciones de ver, descargar o eliminar

### 4.2 Tipos de Archivo Soportados

- **Videos**: MP4
- **Documentos**: PDF
- **Imágenes**: JPG, JPEG, PNG

### 4.3 Límites

- **Tamaño máximo por archivo**: 100MB (configurable)
- **Número máximo de archivos**: 20 por lote (configurable)
- **Acceso**: Solo administradores pueden subir, ver y eliminar archivos

## 5. Seguridad

- **Autenticación requerida**: Solo usuarios autenticados pueden acceder
- **Autorización de roles**: Solo administradores pueden gestionar archivos
- **Políticas de base de datos**: RLS habilitado con políticas específicas
- **Políticas de storage**: Control de acceso a nivel de bucket
- **Validación de archivos**: Verificación de tipo y tamaño en el frontend y backend

## 6. Estructura de Archivos

```
components/ui/file-upload.tsx    # Componente principal de drag & drop
app/admin/files/page.tsx        # Página de gestión de archivos
app/admin/page.tsx              # Panel principal de admin (actualizado)
sql/files_storage.sql           # Migración de base de datos
SETUP_FILES.md                  # Este archivo de configuración
```

## 7. Próximos Pasos

- Configurar CDN para mejor rendimiento de archivos
- Implementar compresión automática de imágenes
- Añadir categorización de archivos
- Implementar búsqueda y filtros
- Añadir logs de actividad de archivos
