# Configuración de Supabase Storage

Este documento explica cómo configurar Supabase Storage para la funcionalidad de archivos multimedia.

## 1. Crear Bucket de Storage

### 1.1 Desde la Consola de Supabase

1. Ve a tu proyecto de Supabase
2. Navega a **Storage** en el menú lateral izquierdo
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

### 1.2 Desde SQL (Alternativo)

Si prefieres usar SQL, ejecuta:

```sql
-- Crear bucket multimedia
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'multimedia',
  'multimedia',
  true,
  104857600, -- 100MB en bytes
  ARRAY['video/mp4', 'application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
);
```

## 2. Configurar Políticas de Storage

### 2.1 Política de Inserción (INSERT)

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

### 2.2 Política de Lectura (SELECT)

```sql
CREATE POLICY "Anyone can view files" ON storage.objects
FOR SELECT USING (bucket_id = 'multimedia');
```

### 2.3 Política de Actualización (UPDATE)

```sql
CREATE POLICY "Only admins can update files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'multimedia' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);
```

### 2.4 Política de Eliminación (DELETE)

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

## 3. Verificar Configuración

### 3.1 Verificar Bucket Existe

```sql
SELECT * FROM storage.buckets WHERE id = 'multimedia';
```

### 3.2 Verificar Políticas

```sql
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

## 4. Estructura de Carpetas

El bucket `multimedia` se organiza de la siguiente manera:

```
multimedia/
├── evidence/          # Archivos de evidencia para preguntas
│   ├── 1234567890-abc123.mp4
│   ├── 1234567891-def456.pdf
│   └── 1234567892-ghi789.jpg
└── uploads/           # Archivos multimedia generales
    ├── 1234567893-jkl012.mp4
    └── 1234567894-mno345.pdf
```

## 5. Variables de Entorno

Asegúrate de que tienes las variables de entorno correctas en tu archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

## 6. Solución de Problemas

### Error: "Bucket not found"
- Verifica que el bucket `multimedia` existe
- Verifica que el nombre del bucket es exactamente `multimedia`
- Verifica que tienes permisos de administrador

### Error: "Permission denied"
- Verifica que las políticas de storage están configuradas correctamente
- Verifica que el usuario tiene rol de administrador
- Verifica que las variables de entorno están configuradas

### Error: "File too large"
- Verifica el límite de tamaño del bucket
- Verifica el límite configurado en el código (50MB por defecto)

## 7. Testing

Para probar la configuración:

1. Ve a `/admin/preguntas`
2. Crea una nueva pregunta
3. Marca "Requiere evidencia"
4. Arrastra un archivo multimedia
5. Envía el formulario

Si todo está configurado correctamente, deberías ver el archivo subido en la consola de Supabase Storage.
