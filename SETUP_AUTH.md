# Configuración del Sistema de Autenticación

## 1. Configurar Supabase

### Paso 1: Ejecutar el SQL en Supabase

Ejecuta el script SQL en tu panel de Supabase (SQL Editor):

```sql
-- El contenido está en: sql/auth_tables.sql
```

### Paso 2: Crear el primer usuario administrador

En el panel de Supabase > Authentication > Users, crear manualmente el primer usuario admin:

1. Hacer clic en "Add user"
2. Introducir email y contraseña
3. Una vez creado, ir a SQL Editor y ejecutar:

```sql
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'tu-email-admin@ejemplo.com';
```

## 2. Variables de Entorno

Asegúrate de que tu archivo `.env` contenga:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## 3. Funcionalidades del Sistema

### Roles:

- **Admin**: Puede ver y editar evidencias, ver y editar observaciones, administrar usuarios
- **User**: Puede responder preguntas, ver evidencias (solo lectura), NO puede ver observaciones

### Permisos por Rol:

#### Usuario (User):

- ✅ Responder preguntas (seleccionar opciones)
- ✅ Ver evidencias existentes (solo lectura)
- ❌ Editar evidencias
- ❌ Ver observaciones
- ❌ Acceder al panel de administración

#### Administrador (Admin):

- ✅ Todas las funcionalidades de Usuario
- ✅ Editar evidencias
- ✅ Ver y editar observaciones
- ✅ Crear nuevos usuarios
- ✅ Cambiar roles de usuarios
- ✅ Acceder al panel de administración

## 4. Uso del Sistema

### Login

- Los usuarios deben iniciar sesión para acceder al sistema
- La pantalla de login aparece automáticamente si no están autenticados

### Panel de Administración

- Accesible en `/admin` solo para administradores
- Permite crear usuarios con roles específicos
- Permite cambiar roles de usuarios existentes

### Formulario de Evaluación

- Diferentes vistas según el rol del usuario
- Campos de evidencia aparecen como solo lectura para usuarios regulares
- Campos de observaciones no son visibles para usuarios regulares

## 5. Seguridad

- Row Level Security (RLS) habilitado en Supabase
- Políticas que aseguran que solo admins pueden ver/editar perfiles
- Autenticación requerida para todas las rutas
- Validación de roles en frontend y backend

## 6. Flujo de Trabajo Típico

1. **Admin configura el sistema**: Crea usuarios, asigna roles
2. **Users completan evaluaciones**: Responden preguntas, pueden ver evidencias existentes
3. **Admin revisa y enriquece**: Edita evidencias, agrega observaciones privadas
4. **Admin gestiona usuarios**: Puede cambiar roles según necesidades

## 7. Comandos Útiles

```bash
# Desarrollo
npm run dev

# Compilar
npm run build

# Linting
npm run lint
```

## Notas Importantes

- El primer usuario admin debe crearse manualmente en Supabase
- Las observaciones son completamente privadas para usuarios regulares
- Los admins pueden actuar como usuarios regulares (ven todas las funcionalidades)
- El sistema usa Supabase Auth para gestión de sesiones
