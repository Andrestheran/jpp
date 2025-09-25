# Sistema de Evaluación de Centros de Simulación

Sistema web para evaluar la calidad de centros de simulación médica con autenticación de usuarios y roles diferenciados.

## 🚀 Características

- **Autenticación completa** con roles Admin/Usuario
- **Gestión dinámica de preguntas** por administradores
- **Formulario de evaluación** con evidencias y observaciones
- **Base de datos** con Supabase
- **Interfaz moderna** con React y Tailwind CSS

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Deployment**: Vercel

## 📦 Instalación Local

1. **Clonar repositorio**

```bash
git clone [URL_DEL_REPO]
cd jpp
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase
```

4. **Ejecutar en desarrollo**

```bash
npm run dev
```

## 🔧 Configuración de Supabase

1. **Crear proyecto** en [Supabase](https://supabase.com)
2. **Ejecutar SQL** del archivo `sql/auth_tables.sql`
3. **Configurar variables** en `.env.local`
4. **Crear usuario admin** siguiendo `SETUP_AUTH.md`

## 🎯 Uso del Sistema

### Administradores

- Gestionar usuarios y roles
- Agregar/eliminar preguntas
- Editar evidencias y observaciones
- Acceso completo al sistema

### Usuarios

- Completar evaluaciones
- Ver evidencias (solo lectura)
- Responder preguntas
- Sin acceso a observaciones

## 📚 Estructura del Proyecto

```
/app/
  /admin/          # Páginas de administración
  /api/            # API routes
  /components/     # Componentes de la app
/components/       # Componentes UI reutilizables
/contexts/         # Context providers
/lib/              # Utilidades y configuración
/sql/              # Scripts de base de datos
```

## 🚀 Deployment

### Vercel (Recomendado)

1. Conectar repositorio con Vercel
2. Configurar variables de entorno
3. Deploy automático

### Variables de Entorno para Producción

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
