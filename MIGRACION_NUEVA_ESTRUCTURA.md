# 🔄 Migración a Nueva Estructura de Precios

## 📋 Resumen de Cambios

Se ha actualizado completamente el sistema de gestión de precios para soportar:

✅ **Precios por KG y por Porción**  
✅ **Productos Combo** (combinación de varios ingredientes)  
✅ **Tipos de Unidad** (KG, Unidad, Porción)  
✅ **Notas y Descripciones** para cada producto  
✅ **37 Productos Iniciales** con precios reales

---

## 🗄️ Cambios en la Base de Datos

### Estructura Antigua
```sql
CREATE TABLE products (
  id UUID,
  name VARCHAR(255),
  category VARCHAR(50),
  price DECIMAL(10, 2),
  active BOOLEAN
);
```

### Estructura Nueva
```sql
CREATE TABLE products (
  id UUID,
  name VARCHAR(255),
  category VARCHAR(50),
  price_per_kg DECIMAL(10, 2) NULL,      -- NUEVO
  price_per_portion DECIMAL(10, 2),      -- NUEVO (reemplaza price)
  unit_type VARCHAR(20),                  -- NUEVO
  is_combo BOOLEAN,                       -- NUEVO
  notes TEXT,                             -- NUEVO
  active BOOLEAN
);
```

---

## 🚀 Pasos para Migrar

### Paso 1: Hacer Backup (IMPORTANTE)

```sql
-- Exporta tus productos actuales antes de migrar
SELECT * FROM products;
```

Guarda el resultado en un archivo CSV o JSON.

### Paso 2: Ejecutar Script de Migración

1. Abre tu proyecto en [Supabase](https://app.supabase.com)
2. Ve a **SQL Editor**
3. Ejecuta el archivo: `database/update_products_structure.sql`

⚠️ **ADVERTENCIA**: Este script elimina la tabla anterior y crea una nueva. Asegúrate de hacer backup primero.

### Paso 3: Verificar Migración

```sql
-- Verificar que se crearon todos los productos
SELECT category, COUNT(*) as total
FROM products
GROUP BY category;

-- Debería mostrar:
-- entradas: 13 productos
-- carnes_clasicas: 4 productos
-- carnes_premium: 5 productos
-- verduras: 5 productos
-- postres: 3 productos
-- pan: 1 producto
-- extras: 1 producto
-- TOTAL: 32 productos
```

### Paso 4: Reiniciar la Aplicación

```bash
# Si está corriendo, detén el servidor
Ctrl + C

# Inicia de nuevo
npm run dev
```

### Paso 5: Verificar en el Panel

1. Abre http://localhost:3001
2. Ve a la pestaña **"Precios"**
3. Verifica que se muestren todos los productos
4. Prueba editar un precio
5. Prueba agregar un nuevo producto

---

## 📦 Productos Incluidos

### 🍴 Entradas (13 productos)

| Producto | Precio/KG | Precio/Porción | Es Combo |
|----------|-----------|----------------|----------|
| Empanadas | - | €1.60 | No |
| Chori | €7.00 | €0.22 | No |
| Pan de chori | - | €0.60 | No |
| **Choripan** | - | **€0.82** | **SÍ** |
| Pan burguer | €2.30 | €0.23 | No |
| Carne Burguer | €8.84 | €0.29 | No |
| Queso Burguer | €8.98 | €0.16 | No |
| Secreto iberico | €25.58 | €1.28 | No |
| **Brochettes** | - | **€0.89** | **SÍ** |
| Tomates | €6.49 | €0.22 | No |
| Mozza | €10.68 | €0.27 | No |
| Jamon | €13.52 | €0.14 | No |

**Combos**:
- **Choripan** = Chori (€0.22) + Pan de chori (€0.60)
- **Brochettes** = Tomates (€0.22) + Mozza (€0.27) + Jamon (€0.14)

### 🥩 Carnes Clásicas (4 productos)

| Producto | Precio/KG | Precio/Porción |
|----------|-----------|----------------|
| Vacio | €15.99 | €1.28 |
| Entraña | €9.99 | €0.80 |
| Entrecot FR | €22.00 | €1.76 |
| Magret de canard | €15.49 | €1.24 |

### 🏆 Carnes Premium (5 productos)

| Producto | Precio/KG | Precio/Porción |
|----------|-----------|----------------|
| Cote de boeuf | €15.99 | €1.28 |
| Entrecot Arg | €35.49 | €2.84 |
| Picanha | €26.49 | €2.12 |
| Costillar | €19.90 | €1.03 |
| Salmon | €16.99 | €1.36 |

### 🥗 Verduras (5 productos)

| Producto | Precio/KG | Precio/Porción |
|----------|-----------|----------------|
| Papas | €1.79 | €0.36 |
| Berengenas | €2.80 | €0.06 |
| Ensalada Verde | €6.99 | €0.23 |
| Durazno | €2.00 | €0.10 |
| Verduras grilles | €2.37 | €0.12 |

### 🍨 Postres (3 productos)

| Producto | Precio/KG | Precio/Porción |
|----------|-----------|----------------|
| Helado | €5.19 | €0.43 |
| Anana | €5.25 | €0.26 |
| Frutos Rojos | €8.24 | €0.27 |

### 🥖 Pan (1 producto)

| Producto | Precio/KG | Precio/Porción |
|----------|-----------|----------------|
| Baguette | €1.04 | €0.13 |

### ➕ Extras (1 producto)

| Producto | Precio/KG | Precio/Porción |
|----------|-----------|----------------|
| Queso feta | €3.14 | €0.16 |

---

## 🎨 Nuevas Características de la Interfaz

### 1. Tarjetas de Producto Mejoradas

```
┌──────────────────────────────────┐
│ Choripan               [COMBO] ●│
├──────────────────────────────────┤
│ Combo: Chori (0.22) + Pan (0.60)│
├──────────────────────────────────┤
│ €/Porción                        │
│ € 0.82        [💾 Guardar]       │
└──────────────────────────────────┘
```

### 2. Productos con Precio por KG

```
┌──────────────────────────────────┐
│ Vacio                          ●│
├──────────────────────────────────┤
│ €/KG           €/Porción         │
│ € 15.99        € 1.28            │
│                                  │
│        [💾 Guardar]              │
└──────────────────────────────────┘
```

### 3. Formulario de Agregar Producto

Nuevos campos:
- ✅ Tipo de Unidad (Porción, KG, Unidad)
- ✅ Precio por Porción (obligatorio)
- ✅ Precio por KG (opcional)
- ✅ Notas/Descripción (opcional)
- ✅ Es un combo (checkbox)
- ✅ Producto activo (checkbox)

---

## 🔧 Cambios Técnicos

### TypeScript

```typescript
// Antes
interface Product {
  price: number
}

// Ahora
interface Product {
  price_per_kg: number | null
  price_per_portion: number
  unit_type: 'kg' | 'unidad' | 'porcion'
  is_combo: boolean
  notes: string | null
}
```

### Componente PriceManager

- ✅ Soporte para editar precio por KG y por porción
- ✅ Badge visual para productos combo
- ✅ Mostrar notas/descripciones
- ✅ Formulario extendido para agregar productos

### API / Supabase

- ✅ Comunicación directa con Supabase (sin API Routes)
- ✅ Compatible con `output: 'export'` de Next.js
- ✅ Actualización de múltiples campos simultáneamente

---

## 📊 Comparación de Productos

### Ejemplo: Choripan

**Cálculo Manual**:
- Chori: €0.22
- Pan de chori: €0.60
- **Total**: €0.82 ✓

**En la Base de Datos**:
```sql
-- Ingredientes
('Chori', 'entradas', 7.00, 0.22, 'kg', false, 'Ingrediente para choripan', true)
('Pan de chori', 'entradas', NULL, 0.60, 'unidad', false, 'Ingrediente para choripan', true)

-- Combo
('Choripan', 'entradas', NULL, 0.82, 'unidad', true, 'Combo: Chori (0.22) + Pan de chori (0.60)', true)
```

---

## 🐛 Solución de Problemas

### No aparecen los productos

1. Verifica que ejecutaste el script SQL correctamente
2. Revisa la consola del navegador (F12)
3. Comprueba las políticas RLS en Supabase

```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'products';
```

### Error al guardar cambios

1. Verifica las variables de entorno `.env.local`
2. Comprueba la conexión a Supabase
3. Revisa los logs en la pestaña Network del navegador

### Los precios no se muestran correctamente

1. Verifica que los campos `price_per_kg` y `price_per_portion` existen en la tabla
2. Ejecuta:

```sql
-- Verificar estructura de tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products';
```

---

## ✅ Checklist de Migración

- [ ] Backup de datos actuales realizado
- [ ] Script `update_products_structure.sql` ejecutado
- [ ] Verificación de productos (32 productos)
- [ ] Aplicación reiniciada
- [ ] Pestaña "Precios" funciona correctamente
- [ ] Se muestran precios por KG y porción
- [ ] Badges de COMBO visibles
- [ ] Notas/descripciones se muestran
- [ ] Edición de productos funciona
- [ ] Agregar nuevo producto funciona
- [ ] Guardar todos funciona

---

## 📞 Notas Importantes

### ⚠️ La migración es destructiva

El script elimina la tabla antigua y crea una nueva. **Haz backup antes de ejecutar**.

### 💡 Productos desactivados

La "Burguer" está desactivada por defecto (`active: false`). Puedes activarla desde el panel.

### 🔄 Sincronización

Los combos (Choripan, Brochettes) tienen su precio calculado, pero si cambias el precio de los ingredientes, deberás actualizar manualmente el precio del combo.

### 🎯 Precios por KG vs Porción

- **Precio por KG**: Lo que pagas al proveedor por kilogramo
- **Precio por Porción**: Lo que cobras al cliente por porción

Ejemplo: Vacio
- Compras a €15.99/KG
- Vendes a €1.28/porción (80g = 0.08kg)

---

## 📚 Archivos Modificados

```
PanelAdmin/
├── src/
│   ├── types/index.ts                    ✏️ Modificado
│   └── components/PriceManager/
│       ├── PriceManager.tsx              ✏️ Modificado
│       └── PriceManager.module.css       ✏️ Modificado
│
└── database/
    └── update_products_structure.sql     ✅ Nuevo
```

---

## 🎉 ¡Migración Completa!

Una vez completados todos los pasos, tendrás un sistema de precios mucho más completo y profesional.

**Características nuevas**:
- ✨ Gestión de combos
- 💰 Precios por KG y por porción
- 📝 Notas y descripciones
- 🏷️ Tipos de unidad
- 📊 37 productos reales con precios del mercado

---

*Desarrollado para Fuegos d'Azur*  
*Sistema de Gestión de Precios v2.0*

