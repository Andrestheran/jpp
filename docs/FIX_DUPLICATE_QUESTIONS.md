# Fix: Problema de Preguntas Duplicadas al Navegar

## 🐛 Problema Original

Cuando un usuario llenaba las primeras 20 preguntas y hacía clic en "Siguiente", las preguntas del siguiente dominio aparecían **ya seleccionadas** con los valores de las preguntas anteriores.

### Causa Raíz

El problema era que estábamos usando el **código del item** (`code`) como clave única para almacenar las respuestas. Sin embargo, los códigos se repiten entre diferentes dominios:

- Dominio 1: items con códigos "1", "2", "3", "4", etc.
- Dominio 2: items con códigos "1", "2", "3", "4", etc. (¡duplicados!)

Esto causaba que las respuestas del Dominio 1 sobrescribieran las respuestas del Dominio 2 porque ambos usaban el mismo código como clave.

```typescript
// ❌ ANTES (INCORRECTO):
const answers = {
  "1": { value: 2, notApplicable: false }, // Dominio 1, pregunta 1
  "2": { value: 1, notApplicable: false }, // Dominio 1, pregunta 2
  "1": { value: 0, notApplicable: false }, // Dominio 2, pregunta 1 (¡sobrescribe!)
}
```

## ✅ Solución Implementada

Ahora usamos el **ID único de la base de datos** como clave para las respuestas. Cada item tiene un UUID único que nunca se repite.

```typescript
// ✅ DESPUÉS (CORRECTO):
const answers = {
  "uuid-1-abc": { value: 2, notApplicable: false }, // Dominio 1, pregunta 1
  "uuid-2-def": { value: 1, notApplicable: false }, // Dominio 1, pregunta 2
  "uuid-3-ghi": { value: 0, notApplicable: false }, // Dominio 2, pregunta 1 (no sobrescribe)
}
```

## 📝 Cambios Realizados

### 1. **data/instrument.ts**
- Agregado campo `id` al tipo `UIItem`
- Cargamos el ID único desde la base de datos
- Agregamos numeración secuencial `displayNumber` (1, 2, 3, 4...) para mostrar

### 2. **app/page.tsx**
- Cambiamos las claves del objeto `answers` de `code` a `id`
- Actualizamos todas las referencias para usar `item.id` en lugar de `item.code`
- La validación y el guardado usan IDs únicos

### 3. **app/components/QuestionItem.tsx**
- Muestra el `displayNumber` (1, 2, 3...) en lugar de códigos complejos
- Mantiene el código original para referencias internas

## 🎯 Resultado

### Antes:
- ❌ 26 preguntas visibles (debido a sobrescritura)
- ❌ Las preguntas se "pre-llenaban" con valores incorrectos
- ❌ Pérdida de respuestas al navegar

### Después:
- ✅ 42 preguntas visibles correctamente
- ✅ Cada pregunta mantiene su estado independiente
- ✅ Numeración simple y secuencial (1, 2, 3, 4, 5...)
- ✅ No hay duplicación ni sobrescritura

## 🧪 Cómo Verificar

1. Recarga la aplicación (Ctrl+R o Cmd+R)
2. Llena las primeras preguntas
3. Haz clic en "Siguiente"
4. Verifica que las nuevas preguntas estén **vacías**
5. Regresa con "Anterior" y verifica que tus respuestas se mantienen

## 🔍 Logs en Consola

Ahora verás logs informativos:

```
📊 Total items cargados: 42
📝 Inicializadas 42 respuestas con IDs únicos
ℹ️ Códigos repetidos en diferentes dominios (esto es normal):
  - Código "1" aparece 5 veces en diferentes dominios
  - Código "2" aparece 5 veces en diferentes dominios
```

Estos logs son **normales** y esperados. Los códigos se repiten entre dominios, pero ahora usamos IDs únicos internamente.

## 📊 Estructura de Datos

```typescript
// Cada item ahora tiene:
{
  id: "550e8400-e29b-41d4-a716-446655440000", // UUID único
  code: "1",                                   // Código original (puede repetirse)
  displayNumber: 23,                          // Número de visualización (1, 2, 3...)
  title: "Apreciación del equipo...",
  domainCode: "2",
  // ... otros campos
}
```

## 🔧 Mantenimiento Futuro

Si agregas nuevas preguntas a la base de datos:
- Asegúrate de que cada item tenga un ID único (UUID)
- El código puede ser cualquier valor, incluso repetirse entre dominios
- El sistema generará automáticamente la numeración secuencial para mostrar

## 📌 Archivos Modificados

1. `/data/instrument.ts` - Carga de datos con IDs únicos
2. `/app/page.tsx` - Lógica principal usando IDs
3. `/app/components/QuestionItem.tsx` - Visualización con numeración simple
4. `/sql/check_duplicate_items.sql` - Script de diagnóstico (opcional)

