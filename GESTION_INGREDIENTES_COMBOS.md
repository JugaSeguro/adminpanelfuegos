# 🍽️ Gestión de Ingredientes de Combos

## 📋 Nueva Funcionalidad

Se ha implementado un sistema completo para gestionar los ingredientes que componen cada producto combo desde una interfaz visual.

---

## ✨ Características

### 1. **Botón "Ver Ingredientes"** 
Los productos marcados como combo ahora tienen un botón naranja para gestionar sus ingredientes.

### 2. **Modal Interactivo**
Popup que muestra:
- ✅ Precio total del combo (calculado automáticamente)
- ✅ Lista de ingredientes actuales con precios
- ✅ Cantidad de cada ingrediente
- ✅ Precio unitario y total por ingrediente
- ✅ Selector para agregar nuevos ingredientes
- ✅ Botón para eliminar ingredientes

### 3. **Cálculo Automático de Precios**
El precio del combo se recalcula automáticamente cuando:
- ✅ Agregas un ingrediente
- ✅ Eliminas un ingrediente
- ✅ Cambias la cantidad de un ingrediente

### 4. **Gestión de Cantidades**
Cada ingrediente tiene un campo de cantidad que permite:
- ✅ Valores decimales (ej: 0.5, 1.5, 2.0)
- ✅ Multiplicar el precio del ingrediente por la cantidad

---

## 🚀 Instalación

### Paso 1: Ejecutar Script SQL

Ejecuta el nuevo script en Supabase:

```bash
PanelAdmin/database/add_combo_ingredients.sql
```

Este script:
1. Crea la tabla `combo_ingredients`
2. Establece las relaciones entre combos e ingredientes
3. Configura las políticas de seguridad (RLS)
4. Inserta las relaciones para Choripan y Brochettes

### Paso 2: Verificar Instalación

```sql
-- Ver las relaciones creadas
SELECT 
  p1.name as combo,
  p2.name as ingrediente,
  ci.quantity as cantidad
FROM combo_ingredients ci
JOIN products p1 ON ci.combo_id = p1.id
JOIN products p2 ON ci.ingredient_id = p2.id
ORDER BY p1.name, p2.name;
```

Deberías ver:
```
combo      | ingrediente    | cantidad
-----------|----------------|----------
Brochettes | Jamon          | 1.0
Brochettes | Mozza          | 1.0
Brochettes | Tomates        | 1.0
Choripan   | Chori          | 1.0
Choripan   | Pan de chori   | 1.0
```

### Paso 3: Reiniciar Aplicación

```bash
npm run dev
```

---

## 🎯 Cómo Usar

### Ver Ingredientes de un Combo

1. Ve a la pestaña **"Precios"** (€)
2. Localiza un producto con badge **"COMBO"** (ej: Choripan, Brochettes)
3. Haz clic en el botón **"Ver Ingredientes"** (botón naranja)
4. Se abre el modal con la gestión de ingredientes

### Agregar un Ingrediente

1. En el modal de ingredientes
2. Ve a la sección **"Agregar ingrediente"**
3. Selecciona un ingrediente del desplegable
4. El ingrediente se agrega automáticamente
5. El precio del combo se recalcula

### Eliminar un Ingrediente

1. En la lista de ingredientes actuales
2. Haz clic en el botón rojo **X** junto al ingrediente
3. Confirma la eliminación
4. El precio del combo se recalcula

### Cambiar Cantidad

1. En cada ingrediente hay un campo numérico
2. Modifica la cantidad (ej: 1.0 → 2.0)
3. El precio se actualiza automáticamente
4. El precio total del combo se recalcula

---

## 📊 Ejemplos de Uso

### Ejemplo 1: Choripan

**Ingredientes:**
- Chori: €0.22 × 1 = €0.22
- Pan de chori: €0.60 × 1 = €0.60

**Precio Total**: €0.82 ✓

### Ejemplo 2: Brochettes

**Ingredientes:**
- Tomates: €0.22 × 1 = €0.22
- Mozza: €0.27 × 1 = €0.27
- Jamon: €0.14 × 1 = €0.14

**Precio Total**: €0.63... ✓ (se redondea a €0.63)

### Ejemplo 3: Combo Personalizado con Cantidades

Si quieres hacer un choripan doble:
- Chori: €0.22 × 2 = €0.44
- Pan de chori: €0.60 × 1 = €0.60

**Precio Total**: €1.04

---

## 🎨 Interfaz Visual

### Tarjeta de Producto Combo

```
┌────────────────────────────────┐
│ Choripan       [COMBO] ●      │
├────────────────────────────────┤
│ Combo: Chori + Pan             │
├────────────────────────────────┤
│ €/Porción (auto-calculado)     │
│ € 0.82                         │
│                                │
│   [📦 Ver Ingredientes]        │
└────────────────────────────────┘
```

### Modal de Ingredientes

```
┌────────────────────────────────────┐
│ 📦 Ingredientes de Choripan    [X]│
├────────────────────────────────────┤
│ Precio Total del Combo: €0.82     │
├────────────────────────────────────┤
│ Ingredientes actuales:             │
│                                    │
│ ┌────────────────────────────────┐│
│ │ Chori                          ││
│ │ €0.22 × 1 = €0.22             ││
│ │           [1.0] [X]            ││
│ └────────────────────────────────┘│
│                                    │
│ ┌────────────────────────────────┐│
│ │ Pan de chori                   ││
│ │ €0.60 × 1 = €0.60             ││
│ │           [1.0] [X]            ││
│ └────────────────────────────────┘│
│                                    │
│ Agregar ingrediente:               │
│ [Seleccionar ingrediente...]      │
│                                    │
│               [✓ Cerrar]          │
└────────────────────────────────────┘
```

---

## 🔧 Estructura Técnica

### Base de Datos

```sql
CREATE TABLE combo_ingredients (
  id UUID PRIMARY KEY,
  combo_id UUID REFERENCES products(id),
  ingredient_id UUID REFERENCES products(id),
  quantity DECIMAL(10, 3),
  UNIQUE(combo_id, ingredient_id)
);
```

### TypeScript

```typescript
interface ComboIngredient {
  id: string
  combo_id: string
  ingredient_id: string
  quantity: number
  created_at: string
  ingredient?: Product
}
```

### Funciones Principales

```typescript
// Abrir modal de ingredientes
handleOpenIngredientsModal(combo: Product)

// Agregar ingrediente al combo
handleAddIngredient(ingredientId: string)

// Eliminar ingrediente del combo
handleRemoveIngredient(ingredientRelationId: string)

// Actualizar cantidad de ingrediente
handleUpdateQuantity(ingredientRelationId: string, newQuantity: number)

// Recalcular precio del combo
recalculateComboPrice(comboId: string)
```

---

## ⚙️ Características Técnicas

### Cálculo Automático
- El precio del combo se calcula sumando: `precio_ingrediente × cantidad`
- Se redondea a 2 decimales
- Se actualiza en tiempo real en la base de datos

### Validaciones
- ✅ No puedes agregar el mismo ingrediente dos veces
- ✅ La cantidad debe ser mayor a 0
- ✅ Solo productos que no son combos pueden ser ingredientes
- ✅ No puedes agregar un combo a sí mismo

### Desempeño
- ✅ Carga de ingredientes con JOIN optimizado
- ✅ Actualización en tiempo real
- ✅ Indicadores de carga durante las operaciones

---

## 🎯 Casos de Uso

### Crear un Nuevo Combo

1. **Crea los ingredientes primero**:
   - Crea "Tomate" con su precio
   - Crea "Lechuga" con su precio
   - Crea "Queso" con su precio

2. **Crea el producto combo**:
   - Nombre: "Ensalada"
   - Marca como "Es un combo": ✓
   - Precio inicial: 0 (se calculará)

3. **Agrega los ingredientes**:
   - Abre "Ver Ingredientes"
   - Agrega Tomate (x1)
   - Agrega Lechuga (x1)
   - Agrega Queso (x1)
   - El precio se calcula automáticamente

### Modificar un Combo Existente

1. Abre "Ver Ingredientes" del combo
2. Opciones:
   - Aumentar cantidad de un ingrediente
   - Eliminar un ingrediente
   - Agregar nuevos ingredientes
3. Los cambios se guardan automáticamente
4. El precio se recalcula instantáneamente

---

## 🔐 Seguridad

### Row Level Security (RLS)

Configurado en la tabla `combo_ingredients`:
- ✅ Lectura pública
- ✅ Escritura para usuarios autenticados

### Validaciones

- ✅ Foreign keys aseguran integridad referencial
- ✅ UNIQUE constraint previene duplicados
- ✅ ON DELETE CASCADE elimina ingredientes si se elimina el combo

---

## 💡 Tips y Mejores Prácticas

### 1. Organización
- Crea primero todos los ingredientes individuales
- Luego crea los combos y asigna ingredientes
- Usa notas descriptivas en los combos

### 2. Precios
- Los ingredientes deben tener precio por porción
- El precio del combo se calcula automáticamente
- No edites manualmente el precio del combo (está deshabilitado)

### 3. Cantidades
- Usa 1.0 para cantidades estándar
- Usa 0.5 para media porción
- Usa 2.0 para doble porción

### 4. Ingredientes Compartidos
- Un mismo ingrediente puede estar en múltiples combos
- Si cambias el precio del ingrediente, afecta a todos los combos que lo usan
- Recuerda actualizar los combos después de cambiar precios de ingredientes

---

## 🐛 Solución de Problemas

### No aparece el botón "Ver Ingredientes"

**Causa**: El producto no está marcado como combo  
**Solución**: 
1. Edita el producto
2. Marca "Es un combo" ✓
3. Guarda

### El precio no se recalcula

**Causa**: Problema con la conexión a Supabase  
**Solución**:
1. Verifica la consola del navegador (F12)
2. Comprueba las variables de entorno
3. Revisa las políticas RLS

### Error al agregar ingrediente

**Causa**: El ingrediente ya existe en el combo  
**Solución**: 
- No puedes agregar el mismo ingrediente dos veces
- Si quieres más cantidad, modifica el campo de cantidad

### Ingredientes no se cargan

**Causa**: No se ejecutó el script SQL  
**Solución**:
```sql
-- Ejecutar en Supabase
\i PanelAdmin/database/add_combo_ingredients.sql
```

---

## 📈 Futuras Mejoras

Ideas para extender la funcionalidad:

- [ ] Drag & drop para reordenar ingredientes
- [ ] Plantillas de combos predefinidos
- [ ] Historial de cambios en ingredientes
- [ ] Costo vs Precio de venta
- [ ] Alertas si el precio del combo es muy bajo
- [ ] Sugerencias de ingredientes populares
- [ ] Duplicar combo con sus ingredientes
- [ ] Comparar precios entre combos

---

## 📊 Estadísticas

### Implementación
- ✅ 1 tabla nueva (combo_ingredients)
- ✅ 5 funciones nuevas en el componente
- ✅ 1 modal completo con gestión
- ✅ ~200 líneas de código TypeScript
- ✅ ~160 líneas de CSS
- ✅ Cálculo automático en tiempo real

---

## ✅ Checklist de Instalación

- [ ] Script `add_combo_ingredients.sql` ejecutado
- [ ] Tabla `combo_ingredients` creada
- [ ] Relaciones iniciales insertadas (Choripan, Brochettes)
- [ ] Aplicación reiniciada
- [ ] Botón "Ver Ingredientes" visible en combos
- [ ] Modal se abre correctamente
- [ ] Agregar ingrediente funciona
- [ ] Eliminar ingrediente funciona
- [ ] Cambiar cantidad funciona
- [ ] Precio se recalcula automáticamente

---

**¡Sistema de Gestión de Ingredientes Completamente Funcional!** 🎉

Con esta funcionalidad puedes crear combos dinámicos y gestionar sus ingredientes de forma visual e intuitiva.

---

*Desarrollado para Fuegos d'Azur*  
*Sistema de Gestión de Ingredientes v1.0*

