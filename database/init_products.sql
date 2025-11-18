-- Script SQL para inicializar la tabla de productos en Supabase
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase

-- 1. Crear la tabla de productos si no existe
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('entradas', 'carnes_clasicas', 'carnes_premium', 'verduras', 'postres', 'pan', 'extras')),
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- 3. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Limpiar tabla (si deseas reiniciar)
-- TRUNCATE TABLE products;

-- 6. Insertar productos con precios de referencia

-- ENTRADAS
INSERT INTO products (name, category, price, active) VALUES
  ('Empanadas', 'entradas', 4.50, true),
  ('Chorizo', 'entradas', 6.80, true),
  ('Pan de chori', 'entradas', 5.20, true),
  ('Secreto iberico', 'entradas', 12.50, true)
ON CONFLICT DO NOTHING;

-- CARNES CLÁSICAS
INSERT INTO products (name, category, price, active) VALUES
  ('Vacio', 'carnes_clasicas', 18.90, true),
  ('Entraña', 'carnes_clasicas', 22.50, true),
  ('Faux fillet', 'carnes_clasicas', 24.00, true)
ON CONFLICT DO NOTHING;

-- CARNES PREMIUM
INSERT INTO products (name, category, price, active) VALUES
  ('Tomahawk', 'carnes_premium', 85.00, true),
  ('Entrecote', 'carnes_premium', 32.50, true),
  ('Picanha', 'carnes_premium', 28.90, true),
  ('Costillar', 'carnes_premium', 34.00, true)
ON CONFLICT DO NOTHING;

-- VERDURAS
INSERT INTO products (name, category, price, active) VALUES
  ('Papas', 'verduras', 4.50, true),
  ('Berengenas', 'verduras', 5.80, true)
ON CONFLICT DO NOTHING;

-- POSTRES
INSERT INTO products (name, category, price, active) VALUES
  ('Helado', 'postres', 6.50, true),
  ('Anana/U', 'postres', 3.80, true)
ON CONFLICT DO NOTHING;

-- PAN
INSERT INTO products (name, category, price, active) VALUES
  ('Baguette/U', 'pan', 2.50, true)
ON CONFLICT DO NOTHING;

-- EXTRAS
INSERT INTO products (name, category, price, active) VALUES
  ('Queso feta', 'extras', 7.90, true)
ON CONFLICT DO NOTHING;

-- 7. Verificar que los productos se insertaron correctamente
SELECT category, COUNT(*) as total_productos, 
       ROUND(AVG(price)::numeric, 2) as precio_promedio
FROM products
GROUP BY category
ORDER BY category;

-- 8. Ver todos los productos
SELECT * FROM products ORDER BY category, name;

-- NOTA: Para dar acceso desde el cliente (Next.js), asegúrate de configurar
-- las políticas de seguridad (RLS - Row Level Security) en Supabase:

-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública (opcional - ajusta según tus necesidades)
CREATE POLICY "Allow public read access" ON products
  FOR SELECT
  USING (true);

-- Política para que solo usuarios autenticados puedan modificar
-- (Ajusta esto según tu sistema de autenticación)
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

-- IMPORTANTE: Las políticas anteriores son muy permisivas.
-- En producción, deberías configurar políticas más restrictivas
-- basadas en roles de usuario (por ejemplo, solo admins pueden modificar).

