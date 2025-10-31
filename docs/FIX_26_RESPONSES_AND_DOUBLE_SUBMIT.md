# Fix: 26 Respuestas Guardadas y Envíos Múltiples

## 🐛 Problemas Reportados

### 1. Solo 26 de 47 Respuestas Guardadas
- El usuario completa las 47 preguntas
- Al descargar el CSV, solo aparecen 26
- Se pierden 21 respuestas (45%)

### 2. Envíos Múltiples
- Al hacer clic en "Enviar" varias veces, se crean múltiples evaluaciones
- Cada clic genera una nueva evaluación duplicada

## ✅ Soluciones Implementadas

### Fix 1: Detección de IDs Duplicados

**Problema Raíz**: Si hay items con IDs duplicados en la base de datos o en la estructura de datos, las respuestas se sobrescriben.

**Solución**:
```typescript
// En app/page.tsx - allItems
const idCounts = new Map<string, number>();
items.forEach(item => {
  idCounts.set(item.id, (idCounts.get(item.id) || 0) + 1);
});

if (duplicates.length > 0) {
  alert(`⚠️ ERROR: Hay ${items.length - idCounts.size} items duplicados`);
}
```

**Resultado**: Ahora muestra un alert si hay IDs duplicados, identificando el problema inmediatamente.

### Fix 2: Prevención de Envíos Múltiples

**Problema Raíz**: El usuario puede hacer clic múltiples veces en "Enviar" antes de que la primera solicitud termine.

**Soluciones Implementadas**:

#### A. Flag de Enviado
```typescript
const [submitted, setSubmitted] = useState(false);

// Al inicio de submit()
if (submitted) {
  alert("Esta evaluación ya fue enviada");
  return;
}
```

#### B. Verificación de Submitting Mejorada
```typescript
if (submitting) {
  alert("Ya se está enviando, por favor espera...");
  return;
}
```

#### C. Botón Deshabilitado
```typescript
<Button 
  disabled={!pageComplete || submitting || submitted}
  className={submitting || submitted ? "opacity-50 cursor-not-allowed" : ""}
>
  {submitted ? "✅ Enviado" : (submitting ? "⏳ Enviando..." : "Enviar")}
</Button>
```

#### D. Recarga Automática Post-Envío
```typescript
// Después de envío exitoso
alert(`✅ Respuestas enviadas! Total: ${answersCount}\nRecargando...`);
setTimeout(() => window.location.reload(), 2000);
```

### Fix 3: Scripts SQL de Diagnóstico

**Archivo**: `sql/check_and_fix_duplicate_ids.sql`

Verifica:
- ✅ Si hay IDs duplicados en la tabla `items`
- ✅ Total de items vs IDs únicos
- ✅ Constraints de unicidad
- ✅ Estructura de la tabla

## 🧪 Cómo Verificar el Fix

### 1. Verificar IDs Únicos en BD

Ejecuta en Supabase SQL Editor:
```sql
SELECT 
    COUNT(*) as total_items,
    COUNT(DISTINCT id) as ids_unicos,
    COUNT(*) - COUNT(DISTINCT id) as duplicados
FROM items;
```

**Resultado Esperado**:
```
total_items | ids_unicos | duplicados
     47     |     47     |     0
```

Si `duplicados > 0`, tienes items con IDs duplicados en la BD.

### 2. Verificar en el Frontend

1. Recarga la aplicación
2. Abre la consola (F12)
3. Busca:
```
📊 Total allItems: 47
🔑 IDs únicos: 47
```

Si ves un alert con "ERROR: Hay X items duplicados", hay un problema.

### 3. Verificar Envío Único

1. Completa el formulario
2. Haz clic en "Enviar"
3. Intenta hacer clic de nuevo → Debe mostrar alert "Ya se está enviando"
4. Después de envío exitoso, botón debe mostrar "✅ Enviado"
5. La página debe recargarse automáticamente

### 4. Verificar Respuestas Guardadas

1. Completa el formulario
2. Envía
3. Ve a Admin → Respuestas
4. Exporta CSV
5. Verifica que hay 47 respuestas (no 26)

## 🔍 Causa Raíz Más Probable

Basándome en que:
- Se guardan exactamente 26 de 47 respuestas
- 26 es aproximadamente la mitad de 47

**Hipótesis Principal**: Hay items con IDs duplicados en la base de datos.

### Escenario A: IDs Duplicados en la BD

```sql
-- Si esto muestra filas, hay duplicados:
SELECT id, COUNT(*) 
FROM items 
GROUP BY id 
HAVING COUNT(*) > 1;
```

**Solución**: Eliminar duplicados:
```sql
-- BACKUP FIRST!
WITH ranked_items AS (
  SELECT 
    id,
    code,
    title,
    subsection_id,
    ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at) as rn
  FROM items
)
DELETE FROM items
WHERE id IN (
  SELECT id FROM ranked_items WHERE rn > 1
);
```

### Escenario B: Items Duplicados al Cargar

Si la consulta retorna el mismo item múltiples veces:
```typescript
// En data/instrument.ts
const { data: itemsData } = await supabase
  .from("items")
  .select("id, subsection_id, code, title, ...");

// Deduplicar por ID
const uniqueItems = Array.from(
  new Map(itemsData.map(item => [item.id, item])).values()
);
```

## 📊 Logging Habilitado

### Frontend
- ✅ Total de items cargados
- ✅ IDs únicos detectados
- ✅ Duplicados identificados
- ✅ Alerta visual si hay duplicados

### Backend
- ✅ Respuestas recibidas
- ✅ Duplicados detectados
- ✅ Respuestas guardadas

## 🎯 Próximos Pasos

1. **Desplegar** los cambios
2. **Ejecutar** `sql/check_and_fix_duplicate_ids.sql`
3. **Compartir** los resultados del script SQL
4. **Probar** el formulario con logging habilitado
5. **Verificar** que:
   - No aparece alert de duplicados
   - Solo se puede enviar una vez
   - Se guardan las 47 respuestas
   - El CSV tiene 47 filas

## 📝 Resultado Esperado Final

```
✅ Carga: 47 items, 47 IDs únicos
✅ Envío: 1 evaluación, sin duplicados
✅ Guardado: 47 respuestas únicas
✅ CSV: 47 filas exportadas
✅ No se puede enviar múltiples veces
✅ Recarga automática post-envío
```

