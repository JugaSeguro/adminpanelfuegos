-- Script para agregar la categoría 'material' e insertar los productos de material
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Modificar la restricción de categoría para incluir 'material'
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;

ALTER TABLE products ADD CONSTRAINT products_category_check 
  CHECK (category IN ('entradas', 'carnes_clasicas', 'carnes_premium', 'verduras', 'postres', 'pan', 'extras', 'material'));

-- 2. Insertar los productos de material
INSERT INTO products (name, category, price_per_kg, price_per_portion, unit_type, is_combo, notes, active) VALUES
  ('Platos grandes', 'material', NULL, 0.50, 'unidad', false, NULL, true),
  ('Platos postres', 'material', NULL, 0.50, 'unidad', false, NULL, true),
  ('Copas vino', 'material', NULL, 0.50, 'unidad', false, NULL, true),
  ('Copas champagne', 'material', NULL, 0.50, 'unidad', false, NULL, true),
  ('Vasos de tragos', 'material', NULL, 0.50, 'unidad', false, NULL, true),
  ('Vasos agua', 'material', NULL, 0.50, 'unidad', false, NULL, true),
  ('Tenedores', 'material', NULL, 0.50, 'unidad', false, NULL, true),
  ('Cuchillos', 'material', NULL, 0.50, 'unidad', false, NULL, true),
  ('Cucharas', 'material', NULL, 0.50, 'unidad', false, NULL, true),
  ('Mesas 10/12', 'material', NULL, 20.00, 'unidad', false, NULL, true),
  ('Mantel mesa 10/12', 'material', NULL, 12.00, 'unidad', false, NULL, true),
  ('Sillas basicas', 'material', NULL, 2.10, 'unidad', false, NULL, true),
  ('Sillas St rezmy', 'material', NULL, 9.60, 'unidad', false, NULL, true),
  ('Tabouret', 'material', NULL, 15.50, 'unidad', false, NULL, true),
  ('Mange debout', 'material', NULL, 18.00, 'unidad', false, NULL, true),
  ('Mantel mange debout', 'material', NULL, 13.00, 'unidad', false, NULL, true),
  ('Sombrilla', 'material', NULL, 45.00, 'unidad', false, NULL, true),
  ('Envio y reprise', 'material', NULL, 200.00, 'unidad', false, NULL, true)
ON CONFLICT (id) DO NOTHING;

-- NOTA: Si la tabla tiene una restricción única en 'name', podrías usar:
-- ON CONFLICT (name) DO UPDATE SET price_per_portion = EXCLUDED.price_per_portion;
-- Pero como no estamos seguros de la restricción única en name, usamos INSERT simple o asumimos que son nuevos.
-- Si ejecutas esto múltiples veces y no hay unique constraint en name, se duplicarán.
-- Para evitar duplicados sin unique constraint, se puede usar:

/*
INSERT INTO products (name, category, price_per_kg, price_per_portion, unit_type, is_combo, notes, active)
SELECT name, category, price_per_kg, price_per_portion, unit_type, is_combo, notes, active
FROM (VALUES
  ('Platos grandes', 'material', NULL::numeric, 0.50, 'unidad', false, NULL, true),
  ('Platos postres', 'material', NULL::numeric, 0.50, 'unidad', false, NULL, true),
  ('Copas vino', 'material', NULL::numeric, 0.50, 'unidad', false, NULL, true),
  ('Copas champagne', 'material', NULL::numeric, 0.50, 'unidad', false, NULL, true),
  ('Vasos de tragos', 'material', NULL::numeric, 0.50, 'unidad', false, NULL, true),
  ('Vasos agua', 'material', NULL::numeric, 0.50, 'unidad', false, NULL, true),
  ('Tenedores', 'material', NULL::numeric, 0.50, 'unidad', false, NULL, true),
  ('Cuchillos', 'material', NULL::numeric, 0.50, 'unidad', false, NULL, true),
  ('Cucharas', 'material', NULL::numeric, 0.50, 'unidad', false, NULL, true),
  ('Mesas 10/12', 'material', NULL::numeric, 20.00, 'unidad', false, NULL, true),
  ('Mantel mesa 10/12', 'material', NULL::numeric, 12.00, 'unidad', false, NULL, true),
  ('Sillas basicas', 'material', NULL::numeric, 2.10, 'unidad', false, NULL, true),
  ('Sillas St rezmy', 'material', NULL::numeric, 9.60, 'unidad', false, NULL, true),
  ('Tabouret', 'material', NULL::numeric, 15.50, 'unidad', false, NULL, true),
  ('Mange debout', 'material', NULL::numeric, 18.00, 'unidad', false, NULL, true),
  ('Mantel mange debout', 'material', NULL::numeric, 13.00, 'unidad', false, NULL, true),
  ('Sombrilla', 'material', NULL::numeric, 45.00, 'unidad', false, NULL, true),
  ('Envio y reprise', 'material', NULL::numeric, 200.00, 'unidad', false, NULL, true)
) AS v(name, category, price_per_kg, price_per_portion, unit_type, is_combo, notes, active)
WHERE NOT EXISTS (
    SELECT 1 FROM products p WHERE p.name = v.name AND p.category = 'material'
);
*/
