# Sistema de Respuestas de Usuarios

## Descripción General

Este documento describe la funcionalidad completa del sistema de guardado, visualización y exportación de respuestas de usuarios.

## Funcionalidades Implementadas

### 1. Guardado de Respuestas

Las respuestas de los usuarios se guardan automáticamente cuando completan el cuestionario:

- **Ubicación**: `/app/api/submit/route.ts`
- **Método**: POST
- **Tablas de Base de Datos**:
  - `evaluations`: Guarda la evaluación completa con contexto
  - `answers`: Guarda cada respuesta individual

#### Información Guardada

**Evaluación**:
- ID de la evaluación
- ID del instrumento
- Contexto (información adicional):
  - Fecha de envío
  - ID del usuario
  - Email del usuario
  - Nombre del usuario
  - Cualquier otro dato contextual

**Respuestas**:
- ID de la evaluación
- ID del ítem (pregunta)
- Puntuación (0, 1, 2 o null)
- No aplicable (boolean)
- Evidencia (texto opcional)
- Observaciones (texto opcional)
- Fecha de creación

### 2. Visualización de Respuestas

Los administradores pueden ver las respuestas guardadas en el panel de administración:

- **Ubicación**: `/admin/respuestas`
- **Acceso**: Solo administradores

#### Características

1. **Lista de Evaluaciones**:
   - Muestra todas las evaluaciones ordenadas por fecha
   - Información visible:
     - ID de evaluación (primeros 8 caracteres)
     - Fecha de evaluación
     - Usuario que respondió
     - Email del usuario
     - Fecha y hora exacta de envío

2. **Detalle de Respuestas**:
   - Al hacer clic en una evaluación se muestran todas sus respuestas
   - Para cada respuesta se muestra:
     - Código del ítem
     - Pregunta
     - Puntuación con código de colores:
       - 🟢 Verde: Puntuación 2
       - 🟠 Naranja: Puntuación 1
       - 🔴 Rojo: Puntuación 0
       - ⚪ Gris: No aplicable
       - 🟡 Amarillo: Sin respuesta
     - Evidencia (si existe)
     - Observaciones (si existen)

3. **Acciones Disponibles**:
   - Ver detalle de respuestas
   - Eliminar evaluación completa (con confirmación)
   - Exportar a Excel

### 3. Exportación a Excel

Los administradores pueden exportar todas las respuestas a un archivo Excel:

- **Ubicación**: `/api/export`
- **Método**: GET
- **Formato**: XLSX (Excel)

#### Contenido del Excel

El archivo exportado contiene **2 hojas**:

##### Hoja 1: "Respuestas"
Contiene el detalle completo de cada respuesta con las siguientes columnas:

- **Información de Evaluación**:
  - ID Evaluación
  - Fecha Evaluación
  - Fecha y Hora Envío
  - Instrumento
  - Usuario
  - Email Usuario
  - ID Usuario

- **Información de Estructura**:
  - Código Dominio
  - Dominio
  - Peso Dominio
  - Código Subsección
  - Subsección

- **Información de Pregunta y Respuesta**:
  - Código Ítem
  - Pregunta
  - Puntuación
  - No Aplicable
  - Evidencia
  - Observaciones
  - Fecha Respuesta

##### Hoja 2: "Resumen Evaluaciones"
Contiene un resumen de cada evaluación:

- ID Evaluación
- Fecha
- Fecha y Hora Envío
- Instrumento
- Usuario
- Email Usuario
- Total Preguntas
- Respondidas
- No Aplicables
- Promedio Puntuación

## Navegación

### Para Administradores

1. Ir a `/admin`
2. En el panel de administración verás 3 tarjetas:
   - **Usuarios**: Gestión de usuarios del sistema
   - **Archivos Multimedia**: Gestión de archivos
   - **Respuestas**: ⭐ Nueva sección para ver y exportar respuestas

3. Hacer clic en "Respuestas" o ir directamente a `/admin/respuestas`

4. En la página de respuestas:
   - **Izquierda**: Lista de evaluaciones
   - **Derecha**: Detalle de respuestas (al seleccionar una evaluación)
   - **Arriba**: Botón "Exportar a Excel"

### Para Usuarios

Los usuarios no necesitan hacer nada especial. Sus respuestas se guardan automáticamente cuando:

1. Completan todas las preguntas del cuestionario
2. Hacen clic en el botón "Enviar" en la última página
3. Ven el mensaje de confirmación "✅ ¡Respuestas enviadas correctamente!"

## Base de Datos

### Tablas Utilizadas

#### `evaluations`
```sql
- id: UUID (primary key)
- instrument_id: UUID (foreign key)
- context: JSONB (información adicional)
- created_at: TIMESTAMP
```

#### `answers`
```sql
- id: UUID (primary key)
- evaluation_id: UUID (foreign key)
- item_id: UUID (foreign key)
- score: INTEGER (0, 1, 2 o null)
- not_applicable: BOOLEAN
- evidence: TEXT
- observations: TEXT
- created_at: TIMESTAMP
```

### Relaciones

- `evaluations` → `instruments` (many-to-one)
- `answers` → `evaluations` (many-to-one)
- `answers` → `items` (many-to-one)
- `items` → `subsections` (many-to-one)
- `subsections` → `domains` (many-to-one)

## Seguridad

- Solo los administradores pueden ver las respuestas
- Solo los administradores pueden exportar a Excel
- Solo los administradores pueden eliminar evaluaciones
- La autenticación se maneja mediante Supabase Auth
- Los permisos se verifican en el componente `ProtectedRoute`

## Archivos Modificados/Creados

### Nuevos Archivos
- `/app/admin/respuestas/page.tsx` - Página de visualización de respuestas
- `/app/api/export/route.ts` - Endpoint de exportación a Excel
- `/docs/RESPUESTAS_USUARIOS.md` - Este documento

### Archivos Modificados
- `/app/admin/page.tsx` - Agregada tarjeta de navegación a Respuestas
- `/app/page.tsx` - Agregado guardado de información del usuario en contexto

## Dependencias

- `xlsx` - Librería para generar archivos Excel (ya estaba instalada)
- `@supabase/supabase-js` - Cliente de Supabase
- `lucide-react` - Iconos (ClipboardList, Download, Eye, Trash2, ArrowLeft)

## Próximos Pasos Sugeridos

1. **Filtros**: Agregar filtros por fecha, usuario o instrumento
2. **Estadísticas**: Agregar gráficos con resumen de respuestas
3. **Búsqueda**: Implementar búsqueda de evaluaciones
4. **Paginación**: Agregar paginación para grandes cantidades de evaluaciones
5. **Exportación Selectiva**: Permitir exportar solo evaluaciones seleccionadas
6. **Notificaciones**: Enviar notificaciones cuando se reciben nuevas respuestas

