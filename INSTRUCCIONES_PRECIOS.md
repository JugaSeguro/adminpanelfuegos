# 📋 Sistema de Gestión de Precios - Instrucciones de Uso

## 🎯 Descripción General

Se ha implementado un sistema completo para que el administrador pueda gestionar los precios de todos los productos desde el Panel de Administración. El sistema incluye:

- ✅ Nueva pestaña "Precios" en el panel principal
- ✅ Interfaz intuitiva para modificar precios
- ✅ Activar/desactivar productos
- ✅ Guardado automático en base de datos
- ✅ Sistema de categorías organizado
- ✅ API REST completa para operaciones CRUD

---

## 🚀 Configuración Inicial

### 1. Configurar la Base de Datos

**Ejecuta el script SQL en Supabase:**

1. Abre tu proyecto en [Supabase](https://app.supabase.com)
2. Ve a **SQL Editor**
3. Abre el archivo `PanelAdmin/database/init_products.sql`
4. Copia y pega el contenido completo
5. Haz clic en **Run**

El script creará:
- ✅ Tabla `products` con todos los campos necesarios
- ✅ 17 productos con precios de referencia
- ✅ Índices para mejor rendimiento
- ✅ Triggers automáticos para `updated_at`
- ✅ Políticas de seguridad básicas

### 2. Variables de Entorno

Asegúrate de tener configurado tu archivo `.env.local` en la raíz del proyecto `PanelAdmin`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
```

---

## 💡 Cómo Usar el Sistema

### Acceder a la Gestión de Precios

1. Abre el Panel de Administración
2. Haz clic en la pestaña **"Precios"** (icono de Euro €)
3. Verás todos los productos organizados por categorías

### Modificar un Precio

1. Localiza el producto en su categoría
2. Haz clic en el campo de precio
3. Ingresa el nuevo precio
4. Haz clic en el botón **"Guardar"** del producto
5. Verás un mensaje de confirmación

### Activar/Desactivar un Producto

1. Usa el interruptor (toggle) en la esquina superior derecha de cada producto
2. Verde = Activo | Gris = Desactivado
3. Los productos desactivados mostrarán una etiqueta roja
4. Haz clic en **"Guardar"** para aplicar el cambio

### Guardar Múltiples Cambios

1. Modifica varios productos
2. Los productos editados se marcarán con un borde naranja
3. Haz clic en **"Guardar Todos (X)"** en la parte superior
4. Todos los cambios se guardarán simultáneamente

---

## 📊 Productos y Categorías

### Entradas
- Empanadas - €4.50
- Chorizo - €6.80
- Pan de chori - €5.20
- Secreto iberico - €12.50

### Carnes Clásicas
- Vacio - €18.90
- Entraña - €22.50
- Faux fillet - €24.00

### Carnes Premium
- Tomahawk - €85.00
- Entrecote - €32.50
- Picanha - €28.90
- Costillar - €34.00

### Verduras
- Papas - €4.50
- Berengenas - €5.80

### Postres
- Helado - €6.50
- Anana/U - €3.80

### Pan
- Baguette/U - €2.50

### Extras
- Queso feta - €7.90

---

## 🏗️ Arquitectura Técnica

### Frontend
```
PanelAdmin/src/components/PriceManager/
├── PriceManager.tsx         # Componente principal
├── PriceManager.module.css  # Estilos del componente
└── index.ts                 # Exportación
```

### Backend (API Routes)
```
PanelAdmin/src/app/api/products/
├── route.ts        # GET (listar) y POST (crear)
└── [id]/route.ts   # PUT (actualizar) y DELETE (eliminar)
```

### Tipos TypeScript
```typescript
// PanelAdmin/src/types/index.ts
export interface Product {
  id: string
  name: string
  category: 'entradas' | 'carnes_clasicas' | 'carnes_premium' | 'verduras' | 'postres' | 'pan' | 'extras'
  price: number
  active: boolean
  created_at: string
  updated_at: string
}
```

### Base de Datos (Supabase/PostgreSQL)
```sql
products (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  category VARCHAR(50),
  price DECIMAL(10, 2),
  active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

---

## 🔌 API Endpoints

### GET /api/products
Obtiene todos los productos ordenados por categoría y nombre.

**Respuesta:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Empanadas",
      "category": "entradas",
      "price": 4.50,
      "active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### PUT /api/products/[id]
Actualiza un producto específico.

**Body:**
```json
{
  "name": "Empanadas",
  "category": "entradas",
  "price": 5.00,
  "active": true
}
```

### POST /api/products
Crea un nuevo producto.

**Body:**
```json
{
  "name": "Nuevo Producto",
  "category": "entradas",
  "price": 10.00,
  "active": true
}
```

### DELETE /api/products/[id]
Elimina un producto.

---

## 🎨 Características de la Interfaz

### Visual
- ✨ Diseño moderno con gradientes
- 🎨 Código de colores por estado
- 📱 Completamente responsive
- 🌈 Animaciones suaves

### Funcional
- ⚡ Guardado individual o masivo
- 🔄 Actualización automática del timestamp
- ✅ Validación de precios (números positivos)
- 💾 Indicadores visuales de cambios pendientes
- 🔔 Notificaciones de éxito/error

### Estados Visuales
- **Producto normal**: Fondo gris claro, borde gris
- **Producto editado**: Fondo amarillo claro, borde naranja
- **Producto desactivado**: Opacidad reducida, etiqueta roja
- **Guardando**: Spinner de carga
- **Hover**: Elevación con sombra

---

## 🔐 Seguridad

### Row Level Security (RLS)
El script SQL incluye políticas básicas de seguridad. Para producción, considera:

```sql
-- Solo admins pueden modificar
CREATE POLICY "Admin only updates" ON products
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');
```

### Validaciones
- ✅ Precios deben ser números positivos
- ✅ Categorías restringidas a valores permitidos
- ✅ Campos requeridos validados en backend
- ✅ Manejo de errores robusto

---

## 🐛 Solución de Problemas

### Los productos no cargan
1. Verifica que el script SQL se ejecutó correctamente
2. Comprueba las variables de entorno
3. Revisa la consola del navegador para errores
4. Verifica las políticas RLS en Supabase

### No se guardan los cambios
1. Verifica la conexión a internet
2. Comprueba las políticas RLS
3. Revisa los logs en la pestaña Network del navegador
4. Verifica que el campo `price` sea un número válido

### Error 500 en la API
1. Revisa los logs de Supabase
2. Verifica que la tabla existe
3. Comprueba las políticas de seguridad
4. Asegúrate de que los tipos de datos coincidan

---

## 📈 Próximas Mejoras (Opcional)

- [ ] Historial de cambios de precios
- [ ] Sistema de autenticación para admin
- [ ] Exportar precios a PDF/Excel
- [ ] Precios por temporada
- [ ] Descuentos y promociones
- [ ] Importar precios desde CSV
- [ ] Comparación de precios con competencia
- [ ] Notificaciones de cambios de precio

---

## 📞 Soporte

Para cualquier consulta o problema:
1. Revisa la documentación en `PanelAdmin/database/README.md`
2. Consulta los logs de la API en `/api/products`
3. Verifica la consola del navegador
4. Revisa los logs de Supabase

---

## ✅ Checklist de Implementación

- [x] Tipos TypeScript definidos
- [x] API endpoints creados (GET, POST, PUT, DELETE)
- [x] Componente PriceManager implementado
- [x] Estilos CSS completos
- [x] Integración con panel principal
- [x] Script SQL de inicialización
- [x] Documentación completa
- [x] Sin errores de linting
- [ ] **Pendiente: Ejecutar script SQL en Supabase**
- [ ] **Pendiente: Configurar variables de entorno**
- [ ] **Pendiente: Probar funcionalidad completa**

---

**🎉 ¡Sistema listo para usar!**

Una vez ejecutes el script SQL en Supabase, podrás acceder inmediatamente a la gestión de precios desde el panel de administración.

---

*Desarrollado para Fuegos d'Azur*  
*Sistema de Gestión de Precios v1.0*

