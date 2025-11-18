# Configuración de Base de Datos - Sistema de Precios

## 📋 Descripción

Este directorio contiene los scripts SQL necesarios para inicializar y configurar la tabla de productos en Supabase para el sistema de gestión de precios del Panel de Administración.

## 🚀 Instalación

### Paso 1: Acceder a Supabase

1. Ve a tu proyecto en [Supabase](https://app.supabase.com)
2. Navega a la sección **SQL Editor** en el menú lateral

### Paso 2: Ejecutar el Script

1. Abre el archivo `init_products.sql`
2. Copia todo el contenido del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **Run** para ejecutar el script

### Paso 3: Verificar la Instalación

El script mostrará automáticamente:
- Un resumen de productos por categoría
- Lista completa de productos insertados

## 📊 Estructura de la Tabla

```sql
products (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

## 🏷️ Categorías de Productos

- **entradas**: Empanadas, Chorizo, Pan de chori, Secreto iberico
- **carnes_clasicas**: Vacio, Entraña, Faux fillet
- **carnes_premium**: Tomahawk, Entrecote, Picanha, Costillar
- **verduras**: Papas, Berengenas
- **postres**: Helado, Anana/U
- **pan**: Baguette/U
- **extras**: Queso feta

## 💰 Precios de Referencia

Los precios iniciales son valores de referencia que pueden ser modificados desde el Panel de Administración:

| Producto | Categoría | Precio |
|----------|-----------|---------|
| Empanadas | Entradas | €4.50 |
| Chorizo | Entradas | €6.80 |
| Pan de chori | Entradas | €5.20 |
| Secreto iberico | Entradas | €12.50 |
| Vacio | Carnes Clásicas | €18.90 |
| Entraña | Carnes Clásicas | €22.50 |
| Faux fillet | Carnes Clásicas | €24.00 |
| Tomahawk | Carnes Premium | €85.00 |
| Entrecote | Carnes Premium | €32.50 |
| Picanha | Carnes Premium | €28.90 |
| Costillar | Carnes Premium | €34.00 |
| Papas | Verduras | €4.50 |
| Berengenas | Verduras | €5.80 |
| Helado | Postres | €6.50 |
| Anana/U | Postres | €3.80 |
| Baguette/U | Pan | €2.50 |
| Queso feta | Extras | €7.90 |

## 🔒 Seguridad (RLS - Row Level Security)

El script incluye políticas de seguridad básicas. **IMPORTANTE**: Las políticas predeterminadas son muy permisivas y están diseñadas para desarrollo.

### Para Producción:

Se recomienda modificar las políticas para restringir el acceso según roles:

```sql
-- Ejemplo: Solo admins pueden modificar precios
CREATE POLICY "Only admins can update products" ON products
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

## 🔧 Mantenimiento

### Agregar un Nuevo Producto

```sql
INSERT INTO products (name, category, price, active) 
VALUES ('Nuevo Producto', 'categoria', 10.00, true);
```

### Actualizar Precio

```sql
UPDATE products 
SET price = 15.00 
WHERE name = 'Nombre del Producto';
```

### Desactivar un Producto

```sql
UPDATE products 
SET active = false 
WHERE name = 'Nombre del Producto';
```

### Ver Todos los Productos

```sql
SELECT * FROM products 
ORDER BY category, name;
```

## 🐛 Solución de Problemas

### Error: "relation 'products' already exists"
La tabla ya existe. Puedes:
1. Eliminarla con `DROP TABLE products CASCADE;` y volver a ejecutar el script
2. O comentar la parte de creación de tabla

### Error: "permission denied"
Asegúrate de tener permisos de administrador en el proyecto de Supabase.

### Los cambios no se reflejan en el Panel
1. Verifica que las variables de entorno en `.env.local` estén correctas
2. Comprueba que RLS esté configurado correctamente
3. Revisa la consola del navegador para errores de API

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)

## ✅ Checklist de Configuración

- [ ] Script SQL ejecutado en Supabase
- [ ] Tabla `products` creada correctamente
- [ ] Productos insertados (17 productos en total)
- [ ] Variables de entorno configuradas en Next.js
- [ ] Políticas RLS configuradas
- [ ] Panel de Administración funcionando
- [ ] Prueba de actualización de precios exitosa

---

**Desarrollado para Fuegos d'Azur**  
*Sistema de Gestión de Precios - Panel de Administración*

