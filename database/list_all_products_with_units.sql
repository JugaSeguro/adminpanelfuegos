-- Script para listar todos los productos con sus unidades y detalles
-- Ejecuta este script en el SQL Editor de Supabase para ver cómo están denominados todos los productos

SELECT 
  id,
  name,
  category,
  unit_type,
  price_per_kg,
  price_per_portion,
  portion_per_person,
  clarifications,
  is_combo,
  active,
  created_at,
  updated_at
FROM products
ORDER BY category, name;

-- También puedes ver solo los productos activos:
-- SELECT name, unit_type, portion_per_person, clarifications 
-- FROM products 
-- WHERE active = true
-- ORDER BY category, name;

-- Ver productos por categoría:
-- SELECT 
--   category,
--   COUNT(*) as total,
--   STRING_AGG(name, ', ' ORDER BY name) as productos
-- FROM products
-- WHERE active = true
-- GROUP BY category
-- ORDER BY category;

