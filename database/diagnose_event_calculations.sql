-- Script de diagnóstico para verificar eventos y sus ingredientes
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Ver todos los eventos calculados
SELECT 
  id,
  name,
  event_date,
  guest_count,
  order_id,
  total_ingredients_count,
  created_at,
  updated_at
FROM event_calculations
WHERE is_active = true
ORDER BY created_at DESC;

-- 2. Ver todos los ingredientes de los eventos (con nombres de productos)
SELECT 
  eci.id,
  eci.event_calculation_id,
  ec.name as event_name,
  p.name as product_name,
  p.category,
  p.unit_type,
  p.is_combo,
  p.active as product_active,
  eci.quantity_per_person,
  eci.total_quantity,
  eci.display_order,
  eci.created_at
FROM event_calculation_ingredients eci
LEFT JOIN event_calculations ec ON eci.event_calculation_id = ec.id
LEFT JOIN products p ON eci.product_id = p.id
WHERE ec.is_active = true
ORDER BY ec.created_at DESC, eci.display_order ASC;

-- 3. Contar ingredientes por evento
SELECT 
  ec.id,
  ec.name,
  COUNT(eci.id) as total_ingredients,
  STRING_AGG(p.name, ', ') as productos
FROM event_calculations ec
LEFT JOIN event_calculation_ingredients eci ON ec.id = eci.event_calculation_id
LEFT JOIN products p ON eci.product_id = p.id
WHERE ec.is_active = true
GROUP BY ec.id, ec.name
ORDER BY ec.created_at DESC;

-- 4. Verificar si hay ingredientes sin producto (NULL)
SELECT 
  eci.id,
  eci.event_calculation_id,
  ec.name as event_name,
  eci.product_id,
  eci.quantity_per_person,
  eci.display_order
FROM event_calculation_ingredients eci
LEFT JOIN event_calculations ec ON eci.event_calculation_id = ec.id
LEFT JOIN products p ON eci.product_id = p.id
WHERE ec.is_active = true
  AND p.id IS NULL;

-- 5. Verificar productos que deberían estar pero no están
-- (Comparar con los nombres del pedido)
SELECT 
  name,
  category,
  unit_type,
  is_combo,
  active,
  portion_per_person
FROM products
WHERE active = true
  AND (
    name ILIKE '%empanada%' OR
    name ILIKE '%burguer%' OR
    name ILIKE '%burger%' OR
    name ILIKE '%entrecot%arg%' OR
    name ILIKE '%salmon%' OR
    name ILIKE '%saumon%' OR
    name ILIKE '%picanha%' OR
    name ILIKE '%fruit%flambe%'
  )
ORDER BY name;

-- 6. Ver el último evento creado con todos sus detalles
WITH last_event AS (
  SELECT id
  FROM event_calculations
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  ec.*,
  (
    SELECT json_agg(
      json_build_object(
        'id', eci.id,
        'product_id', eci.product_id,
        'product_name', p.name,
        'quantity_per_person', eci.quantity_per_person,
        'total_quantity', eci.total_quantity,
        'display_order', eci.display_order
      )
    )
    FROM event_calculation_ingredients eci
    LEFT JOIN products p ON eci.product_id = p.id
    WHERE eci.event_calculation_id = ec.id
  ) as ingredients
FROM event_calculations ec
WHERE ec.id = (SELECT id FROM last_event);

