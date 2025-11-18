-- Script para agregar tabla de relación entre combos e ingredientes

-- 1. Crear tabla de ingredientes de combo
CREATE TABLE IF NOT EXISTS combo_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  combo_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 3) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(combo_id, ingredient_id)
);

-- 2. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_combo_ingredients_combo_id ON combo_ingredients(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_ingredients_ingredient_id ON combo_ingredients(ingredient_id);

-- 3. Insertar relaciones para los combos existentes

-- Choripan = Chori + Pan de chori
INSERT INTO combo_ingredients (combo_id, ingredient_id, quantity)
SELECT 
  (SELECT id FROM products WHERE name = 'Choripan'),
  (SELECT id FROM products WHERE name = 'Chori'),
  1.0
WHERE EXISTS (SELECT 1 FROM products WHERE name = 'Choripan')
AND EXISTS (SELECT 1 FROM products WHERE name = 'Chori')
ON CONFLICT DO NOTHING;

INSERT INTO combo_ingredients (combo_id, ingredient_id, quantity)
SELECT 
  (SELECT id FROM products WHERE name = 'Choripan'),
  (SELECT id FROM products WHERE name = 'Pan de chori'),
  1.0
WHERE EXISTS (SELECT 1 FROM products WHERE name = 'Choripan')
AND EXISTS (SELECT 1 FROM products WHERE name = 'Pan de chori')
ON CONFLICT DO NOTHING;

-- Brochettes = Tomates + Mozza + Jamon
INSERT INTO combo_ingredients (combo_id, ingredient_id, quantity)
SELECT 
  (SELECT id FROM products WHERE name = 'Brochettes'),
  (SELECT id FROM products WHERE name = 'Tomates'),
  1.0
WHERE EXISTS (SELECT 1 FROM products WHERE name = 'Brochettes')
AND EXISTS (SELECT 1 FROM products WHERE name = 'Tomates')
ON CONFLICT DO NOTHING;

INSERT INTO combo_ingredients (combo_id, ingredient_id, quantity)
SELECT 
  (SELECT id FROM products WHERE name = 'Brochettes'),
  (SELECT id FROM products WHERE name = 'Mozza'),
  1.0
WHERE EXISTS (SELECT 1 FROM products WHERE name = 'Brochettes')
AND EXISTS (SELECT 1 FROM products WHERE name = 'Mozza')
ON CONFLICT DO NOTHING;

INSERT INTO combo_ingredients (combo_id, ingredient_id, quantity)
SELECT 
  (SELECT id FROM products WHERE name = 'Brochettes'),
  (SELECT id FROM products WHERE name = 'Jamon'),
  1.0
WHERE EXISTS (SELECT 1 FROM products WHERE name = 'Brochettes')
AND EXISTS (SELECT 1 FROM products WHERE name = 'Jamon')
ON CONFLICT DO NOTHING;

-- 4. Habilitar RLS
ALTER TABLE combo_ingredients ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de seguridad
CREATE POLICY "Allow public read access" ON combo_ingredients
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to update" ON combo_ingredients
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert" ON combo_ingredients
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete" ON combo_ingredients
  FOR DELETE
  USING (true);

-- 6. Ver relaciones creadas
SELECT 
  p1.name as combo,
  p2.name as ingrediente,
  ci.quantity as cantidad
FROM combo_ingredients ci
JOIN products p1 ON ci.combo_id = p1.id
JOIN products p2 ON ci.ingredient_id = p2.id
ORDER BY p1.name, p2.name;

