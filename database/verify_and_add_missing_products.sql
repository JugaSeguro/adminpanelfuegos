-- Script para verificar y agregar productos faltantes necesarios para los pedidos
-- Ejecuta este script en el SQL Editor de Supabase

-- Lista de productos que deben existir según los pedidos
-- Basado en: empanadas, tapas-chorizo, saumon, bife-chorizo, entrecote-france, fruits-flambes

-- Verificar productos existentes
SELECT name, category, active 
FROM products 
WHERE name ILIKE '%empanada%' 
   OR name ILIKE '%chorizo%' 
   OR name ILIKE '%salmon%' 
   OR name ILIKE '%saumon%'
   OR name ILIKE '%bife%'
   OR name ILIKE '%entrecot%'
   OR name ILIKE '%entrecote%'
   OR name ILIKE '%fruit%'
   OR name ILIKE '%flambe%'
ORDER BY name;

-- Agregar productos faltantes si no existen
-- NOTA: Ajusta los precios según tus valores reales

-- Empanadas
INSERT INTO products (name, category, price_per_portion, unit_type, is_combo, active, portion_per_person, clarifications)
SELECT 'Empanadas', 'entradas', 4.50, 'porcion', false, true, '1', NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name ILIKE '%empanada%');

-- Chorizo (para tapas-chorizo)
INSERT INTO products (name, category, price_per_portion, unit_type, is_combo, active, portion_per_person, clarifications)
SELECT 'Chorizo', 'entradas', 6.80, 'porcion', false, true, '1/4', 'Con 1 chorizo hago 4 choripanes'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name ILIKE '%chorizo%' AND category = 'entradas');

-- Pan de chori
INSERT INTO products (name, category, price_per_portion, unit_type, is_combo, active, portion_per_person, clarifications)
SELECT 'Pan de chori', 'pan', 5.20, 'porcion', false, true, '1/2', 'Con 1 pan hago 2 choris'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name ILIKE '%pan de chori%' OR name ILIKE '%pan chori%');

-- Salmon/Saumon
INSERT INTO products (name, category, price_per_portion, unit_type, is_combo, active, portion_per_person, clarifications)
SELECT 'Salmon', 'carnes_premium', 15.00, 'porcion', false, true, '150 gr', NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE (name ILIKE '%salmon%' OR name ILIKE '%saumon%') AND category IN ('carnes_premium', 'carnes_clasicas'));

-- Bife de chorizo
INSERT INTO products (name, category, price_per_portion, unit_type, is_combo, active, portion_per_person, clarifications)
SELECT 'Bife de chorizo', 'carnes_clasicas', 22.00, 'porcion', false, true, '250 gr', NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name ILIKE '%bife%chorizo%' OR name ILIKE '%bife chorizo%');

-- Entrecot FR (entrecote-france)
INSERT INTO products (name, category, price_per_portion, unit_type, is_combo, active, portion_per_person, clarifications)
SELECT 'Entrecot FR', 'carnes_premium', 28.00, 'porcion', false, true, '250 gr', NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE (name ILIKE '%entrecot%fr%' OR name ILIKE '%entrecote%france%') AND category = 'carnes_premium');

-- Fruits flambes
INSERT INTO products (name, category, price_per_portion, unit_type, is_combo, active, portion_per_person, clarifications)
SELECT 'Fruits flambes', 'postres', 8.00, 'porcion', false, true, '40 gr', NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE (name ILIKE '%fruit%flambe%' OR name ILIKE '%fruits%flambes%'));

-- Verificar productos después de la inserción
SELECT 
  name, 
  category, 
  price_per_portion, 
  portion_per_person, 
  clarifications,
  active
FROM products 
WHERE name ILIKE '%empanada%' 
   OR name ILIKE '%chorizo%' 
   OR name ILIKE '%salmon%' 
   OR name ILIKE '%saumon%'
   OR name ILIKE '%bife%'
   OR name ILIKE '%entrecot%'
   OR name ILIKE '%entrecote%'
   OR name ILIKE '%fruit%'
   OR name ILIKE '%flambe%'
ORDER BY category, name;


