# Diagnóstico: Solo 26 de 47 Respuestas Guardadas

## 🐛 Problema Reportado

- El usuario completó las 47 preguntas
- Al descargar el CSV, solo aparecen 26 respuestas
- Se están perdiendo aproximadamente **21 respuestas** (45% del total)

## 🔍 Posibles Causas

### 1. IDs Duplicados en el Frontend
Si `allItems` tiene items con IDs duplicados, el objeto `answers` sobrescribirá respuestas:
```typescript
// Si hay 2 items con el mismo ID
answers["uuid-123"] = { value: 2 }  // Primera respuesta
answers["uuid-123"] = { value: 1 }  // ¡Sobrescribe la anterior!
```

### 2. Deduplicación Excesiva en el Backend
El backend elimina respuestas duplicadas por `item_id`. Si hay duplicados legítimos, se perderán respuestas.

### 3. Items Sin ID en la Base de Datos
Si algunos items no tienen ID o el ID es null, se filtrarán.

## 📊 Cómo Diagnosticar

### Paso 1: Verificar en la Consola del Navegador

Cuando completes y envíes el formulario, busca estos logs:

```
📊 Total items cargados: 47
🔑 Total unique item IDs: 47  ← ¿Coincide con el total?
✅ Todos los itemIds son únicos en el frontend
📊 Enviando 47 respuestas desde el frontend
```

**Si ves:**
- `🚨 HAY IDs DUPLICADOS` → El problema está en la carga de datos
- `🚨 DUPLICADOS EN FRONTEND` → El problema está en el frontend

### Paso 2: Verificar en los Logs del Servidor

En Vercel o tu consola del servidor, busca:

```
📊 Procesando 47 respuestas del frontend
✅ Se generaron 47 filas válidas
✅ No hay duplicados. Insertando 47 respuestas únicas
```

**Si ves:**
- `⚠️ Se eliminaron X respuestas duplicadas` → Hay duplicados llegando al backend
- `🚨 DUPLICADOS DETECTADOS` → Lista los IDs problemáticos

### Paso 3: Ejecutar Script SQL de Diagnóstico

En Supabase SQL Editor, ejecuta:
```sql
-- Ver archivo: sql/diagnose_answers_issue.sql
```

Esto te mostrará:
1. Total de items en la BD
2. Si hay IDs duplicados
3. Cuántas respuestas tiene la última evaluación
4. Distribución por dominio
5. Si hay respuestas duplicadas

### Ejemplo de Diagnóstico

#### Escenario A: Duplicados en la BD
```
📊 Total items across all domains: 47
🔑 Total unique item IDs: 26  ← ¡PROBLEMA!
🚨 HAY IDs DUPLICADOS: 47 items pero solo 26 IDs únicos
```

**Solución**: Hay items con el mismo ID en la base de datos. Necesitas:
```sql
-- Encontrar duplicados
SELECT id, COUNT(*) 
FROM items 
GROUP BY id 
HAVING COUNT(*) > 1;
```

#### Escenario B: Deduplicación Excesiva
```
📊 Procesando 47 respuestas del frontend
✅ Se generaron 47 filas válidas
🚨 DUPLICADOS DETECTADOS (21 items con duplicados)
⚠️ Se eliminaron 21 respuestas duplicadas
```

**Solución**: El frontend está enviando IDs duplicados. Revisar `allItems`.

#### Escenario C: Items Sin ID
```
❌ No se encontró item_id para respuesta X:
  itemId: undefined
  itemCode: "1"
  domainCode: "2"
```

**Solución**: Algunos items no tienen ID en la estructura de datos.

## 🛠️ Soluciones por Escenario

### Si hay IDs duplicados en la BD:

1. **Identificar los duplicados:**
```sql
SELECT id, code, title, COUNT(*)
FROM items
GROUP BY id, code, title
HAVING COUNT(*) > 1;
```

2. **Eliminar duplicados:**
```sql
-- CUIDADO: Hacer backup primero
DELETE FROM items a
USING items b
WHERE a.id = b.id 
  AND a.ctid < b.ctid;
```

### Si hay duplicados en el Frontend:

Verificar que `loadDomains()` retorne items únicos:
```typescript
// En data/instrument.ts
console.log("Verificando IDs únicos...");
const allItemIds = domains.flatMap(d => 
  d.subsections.flatMap(s => s.items.map(i => i.id))
);
const unique = new Set(allItemIds);
console.log(`Total: ${allItemIds.length}, Únicos: ${unique.size}`);
```

### Si la deduplicación es el problema:

**Opción A**: Deshabilitar temporalmente la deduplicación (solo para debug):
```typescript
// En route.ts, comentar:
// const uniqueRows = Array.from(...);
// Usar directamente:
const { error: insErr } = await sb.from("answers").insert(rows);
```

**Opción B**: Hacer que falle si hay duplicados en lugar de eliminarlos:
```typescript
if (duplicateItemIds.length > 0) {
  return NextResponse.json({
    error: "Se detectaron respuestas duplicadas",
    duplicates: duplicateItemIds
  }, { status: 400 });
}
```

## 📝 Checklist de Verificación

- [ ] Ejecutar `sql/diagnose_answers_issue.sql` en Supabase
- [ ] Completar formulario y ver logs de consola
- [ ] Verificar logs del servidor (Vercel/consola)
- [ ] Verificar que todos los items tengan ID único
- [ ] Confirmar que no hay duplicados en `allItems`
- [ ] Verificar que el payload tiene 47 respuestas
- [ ] Confirmar que el backend recibe 47 respuestas
- [ ] Verificar que se insertan 47 respuestas en la BD

## 🎯 Resultado Esperado

Después de diagnosticar y corregir:

```
✅ 47 items cargados
✅ 47 IDs únicos
✅ 47 respuestas enviadas
✅ 47 respuestas guardadas
✅ 47 respuestas en el CSV
```

## 📞 Siguiente Paso

**Por favor ejecuta el script SQL y comparte los resultados** para identificar exactamente dónde está el problema.

