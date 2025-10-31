# Fix: Error de Duplicación al Guardar Respuestas

## 🐛 Problema

Después de completar todas las preguntas y hacer clic en "Enviar", aparecía este error:

```
Error al enviar las respuestas: Error: {"error":"Error guardando respuestas","details":"duplicate key value violates unique constraint \"answers_evaluation_id_item_id_key\""}
```

## 🔍 Causa Raíz

El problema tenía dos partes:

### 1. Códigos Duplicados
- Los códigos de items se repiten entre dominios (código "1" aparece en cada dominio)
- El API buscaba items por código: `.in("code", codes)`
- Cuando había códigos duplicados, la query devolvía **múltiples items**
- El Map `codeToId` solo guardaba el último item encontrado
- Esto causaba que se intentara insertar el mismo `item_id` varias veces

### 2. Constraint en la Base de Datos
```sql
UNIQUE CONSTRAINT "answers_evaluation_id_item_id_key"
```
- La tabla `answers` tiene un constraint único para la combinación `(evaluation_id, item_id)`
- No se pueden insertar múltiples respuestas para el mismo item en la misma evaluación
- Cuando intentábamos insertar duplicados, el constraint fallaba

## ✅ Solución Implementada

### Backend: `/app/api/submit/route.ts`

1. **Cambio en el Schema**
```typescript
// ANTES:
itemCode: z.string() // Solo código

// DESPUÉS:
itemId: z.string().optional()    // ID único (preferido)
itemCode: z.string().optional()  // Código (fallback)
```

2. **Priorizar itemId sobre itemCode**
```typescript
// Si viene itemId, usarlo directamente
// Si no, buscar por código (con advertencia de duplicados)
const item_id = a.itemId || codeToId.get(a.itemCode!);
```

3. **Deduplicación Automática**
```typescript
// Eliminar duplicados por item_id antes de insertar
const uniqueRows = Array.from(
  new Map(rows.map(row => [row.item_id, row])).values()
);
```

### Frontend: `/app/page.tsx`

Enviar el `itemId` en el payload:
```typescript
answers: allItems.map((i) => ({
  itemId: i.id,        // ✅ ID único (nuevo)
  itemCode: i.code,    // Código para referencia
  domainCode: i.domainCode,
  // ...
}))
```

## 📊 Flujo de Datos

### Antes (Con Error):
```
Frontend → { itemCode: "1" } 
    ↓
Backend busca: SELECT * FROM items WHERE code = '1'
    ↓
Encuentra múltiples items (uno por dominio)
    ↓
Intenta insertar el mismo item_id varias veces
    ↓
❌ ERROR: duplicate key constraint
```

### Después (Correcto):
```
Frontend → { itemId: "uuid-123", itemCode: "1" }
    ↓
Backend usa directamente: itemId = "uuid-123"
    ↓
Deduplica por item_id
    ↓
Inserta respuestas únicas
    ↓
✅ SUCCESS
```

## 🔧 Compatibilidad

El sistema ahora soporta **ambos formatos**:

### Modo Nuevo (Recomendado):
```json
{
  "itemId": "550e8400-e29b-41d4-a716-446655440000",
  "itemCode": "1",
  "score": 2
}
```

### Modo Legacy (Fallback):
```json
{
  "itemCode": "1",
  "score": 2
}
```

⚠️ **Advertencia**: El modo legacy puede tener problemas con códigos duplicados.

## 🧪 Verificación

Para verificar que funciona:

1. Completa todas las preguntas (42)
2. Haz clic en "Enviar"
3. Deberías ver:
   ```
   ✅ ¡Respuestas enviadas correctamente!
   ```

### En la Consola del Servidor:
```
📊 Enviando 42 respuestas únicas
```

Si hay duplicados detectados:
```
⚠️ Se eliminaron 3 respuestas duplicadas
```

## 🛡️ Protecciones Adicionales

1. **Deduplicación automática** - Si hay duplicados, se eliminan
2. **Validación de item_id** - No se insertan respuestas sin item_id válido
3. **Logging detallado** - Los errores se registran para debugging
4. **Respuesta informativa** - Retorna el número de respuestas guardadas

## 📝 Respuesta del API

### Exitosa:
```json
{
  "ok": true,
  "evaluationId": "eval-uuid-123",
  "answersCount": 42
}
```

### Con Error:
```json
{
  "error": "Error guardando respuestas",
  "details": "mensaje de error detallado"
}
```

## 🔗 Archivos Modificados

1. `/app/api/submit/route.ts` - Lógica de guardado con deduplicación
2. `/app/page.tsx` - Envío de itemId en el payload
3. `/data/instrument.ts` - Ya modificado previamente con IDs únicos

## 🎯 Resultado Final

- ✅ Sin errores de duplicación
- ✅ Todas las 42 respuestas se guardan correctamente
- ✅ Sistema robusto con deduplicación automática
- ✅ Compatibilidad con formato anterior (fallback)
- ✅ Logging detallado para debugging

