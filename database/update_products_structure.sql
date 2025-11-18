-- Script SQL para actualizar la estructura de productos con precios por KG y porción
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase

-- 1. Eliminar la tabla anterior si existe (CUIDADO: esto borra todos los datos)
DROP TABLE IF EXISTS products CASCADE;

-- 2. Crear la nueva tabla con estructura actualizada
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('entradas', 'carnes_clasicas', 'carnes_premium', 'verduras', 'postres', 'pan', 'extras')),
  price_per_kg DECIMAL(10, 2) NULL,
  price_per_portion DECIMAL(10, 2) NOT NULL,
  unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('kg', 'unidad', 'porcion')),
  is_combo BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Crear índices
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_is_combo ON products(is_combo);

-- 4. Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Insertar productos con la nueva estructura

-- ENTRADAS
INSERT INTO products (name, category, price_per_kg, price_per_portion, unit_type, is_combo, notes, active) VALUES
  ('Empanadas', 'entradas', NULL, 1.60, 'unidad', false, NULL, true),
  ('Chori', 'entradas', 7.00, 0.22, 'kg', false, 'Ingrediente para choripan', true),
  ('Pan de chori', 'entradas', NULL, 0.60, 'unidad', false, 'Ingrediente para choripan', true),
  ('Choripan', 'entradas', NULL, 0.82, 'unidad', true, 'Combo: Chori (0.22) + Pan de chori (0.60)', true),
  ('Burguer', 'entradas', NULL, 0.69, 'porcion', true, 'Pan burguer (0.23) + Carne (0.29) + Queso (0.16)', false),
  ('Pan burguer', 'entradas', 2.30, 0.23, 'kg', false, 'Ingrediente para burguer', true),
  ('Carne Burguer', 'entradas', 8.84, 0.29, 'kg', false, 'Ingrediente para burguer', true),
  ('Queso Burguer', 'entradas', 8.98, 0.16, 'kg', false, 'Ingrediente para burguer', true),
  ('Secreto iberico', 'entradas', 25.58, 1.28, 'kg', false, NULL, true),
  ('Brochettes', 'entradas', NULL, 0.89, 'porcion', true, 'Tomates (0.22) + Mozza (0.27) + Jamon (0.14)', true),
  ('Tomates', 'entradas', 6.49, 0.22, 'kg', false, 'Ingrediente para brochettes', true),
  ('Mozza', 'entradas', 10.68, 0.27, 'kg', false, 'Ingrediente para brochettes', true),
  ('Jamon', 'entradas', 13.52, 0.14, 'kg', false, 'Ingrediente para brochettes', true)
ON CONFLICT DO NOTHING;

-- CARNES CLÁSICAS
INSERT INTO products (name, category, price_per_kg, price_per_portion, unit_type, is_combo, notes, active) VALUES
  ('Vacio', 'carnes_clasicas', 15.99, 1.28, 'kg', false, NULL, true),
  ('Entraña', 'carnes_clasicas', 9.99, 0.80, 'kg', false, NULL, true),
  ('Entrecot FR', 'carnes_clasicas', 22.00, 1.76, 'kg', false, NULL, true),
  ('Magret de canard', 'carnes_clasicas', 15.49, 1.24, 'kg', false, NULL, true)
ON CONFLICT DO NOTHING;

-- CARNES PREMIUM
INSERT INTO products (name, category, price_per_kg, price_per_portion, unit_type, is_combo, notes, active) VALUES
  ('Cote de boeuf', 'carnes_premium', 15.99, 1.28, 'kg', false, NULL, true),
  ('Entrecot Arg', 'carnes_premium', 35.49, 2.84, 'kg', false, NULL, true),
  ('Picanha', 'carnes_premium', 26.49, 2.12, 'kg', false, NULL, true),
  ('Costillar', 'carnes_premium', 19.90, 1.03, 'kg', false, NULL, true),
  ('Salmon', 'carnes_premium', 16.99, 1.36, 'kg', false, NULL, true)
ON CONFLICT DO NOTHING;

-- VERDURAS
INSERT INTO products (name, category, price_per_kg, price_per_portion, unit_type, is_combo, notes, active) VALUES
  ('Papas', 'verduras', 1.79, 0.36, 'kg', false, NULL, true),
  ('Berengenas', 'verduras', 2.80, 0.06, 'kg', false, NULL, true),
  ('Ensalada Verde', 'verduras', 6.99, 0.23, 'kg', false, NULL, true),
  ('Durazno', 'verduras', 2.00, 0.10, 'kg', false, NULL, true),
  ('Verduras grilles', 'verduras', 2.37, 0.12, 'kg', false, NULL, true)
ON CONFLICT DO NOTHING;

-- POSTRES
INSERT INTO products (name, category, price_per_kg, price_per_portion, unit_type, is_combo, notes, active) VALUES
  ('Helado', 'postres', 5.19, 0.43, 'kg', false, NULL, true),
  ('Anana', 'postres', 5.25, 0.26, 'unidad', false, NULL, true),
  ('Frutos Rojos', 'postres', 8.24, 0.27, 'kg', false, NULL, true)
ON CONFLICT DO NOTHING;

-- PAN
INSERT INTO products (name, category, price_per_kg, price_per_portion, unit_type, is_combo, notes, active) VALUES
  ('Baguette', 'pan', 1.04, 0.13, 'unidad', false, NULL, true)
ON CONFLICT DO NOTHING;

-- EXTRAS
INSERT INTO products (name, category, price_per_kg, price_per_portion, unit_type, is_combo, notes, active) VALUES
  ('Queso feta', 'extras', 3.14, 0.16, 'kg', false, NULL, true)
ON CONFLICT DO NOTHING;

-- 6. Verificar los productos insertados
SELECT 
  category,
  COUNT(*) as total_productos,
  COUNT(CASE WHEN is_combo THEN 1 END) as combos,
  ROUND(AVG(price_per_portion)::numeric, 2) as precio_promedio_porcion
FROM products
GROUP BY category
ORDER BY category;

-- 7. Ver todos los productos con detalles
SELECT 
  name,
  category,
  COALESCE(price_per_kg::text, '-') as precio_kg,
  price_per_portion as precio_porcion,
  unit_type as tipo,
  CASE WHEN is_combo THEN 'SÍ' ELSE 'NO' END as es_combo,
  COALESCE(notes, '-') as notas
FROM products
ORDER BY category, name;

-- 8. Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 9. Políticas de seguridad (permisivas para desarrollo)
CREATE POLICY "Allow public read access" ON products
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to update" ON products
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert" ON products
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete" ON products
  FOR DELETE
  USING (true);

-- NOTA: En producción, ajusta las políticas según tus necesidades de seguridad

