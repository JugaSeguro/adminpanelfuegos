-- Script SQL para agregar campos de porción por persona y aclaraciones
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase

-- Agregar columna portion_per_person (porción por persona)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS portion_per_person VARCHAR(50) NULL;

-- Agregar columna clarifications (aclaraciones)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS clarifications TEXT NULL;

-- Comentarios para documentar los campos
COMMENT ON COLUMN products.portion_per_person IS 'Cantidad necesaria por persona (ej: 1/4, 1/2, 30 gr, 1 feta)';
COMMENT ON COLUMN products.clarifications IS 'Aclaraciones importantes para el cálculo (ej: Con 1 chorizo hago 4 choripanes)';

-- Actualizar algunos productos de ejemplo con los datos proporcionados
UPDATE products SET 
  portion_per_person = '1/4',
  clarifications = 'Con 1 chorizo hago 4 choripanes'
WHERE name ILIKE '%chorizo%' AND category = 'entradas';

UPDATE products SET 
  portion_per_person = '1/2',
  clarifications = 'Con 1 pan hago 2 choris'
WHERE name ILIKE '%pan de chori%' AND category = 'entradas';

UPDATE products SET 
  portion_per_person = '1',
  clarifications = 'Paquete trae 56 fetas'
WHERE name ILIKE '%queso%' AND name ILIKE '%mini burger%';

UPDATE products SET 
  portion_per_person = '1',
  clarifications = '1 Tomate cherry'
WHERE name ILIKE '%tomate%' AND name ILIKE '%brochette%';

UPDATE products SET 
  portion_per_person = '25 gr',
  clarifications = 'Cada bolita que metemos al brochette tiene 25 gr y viene en un pote de 1 kg'
WHERE name ILIKE '%mozzarella%';

UPDATE products SET 
  portion_per_person = '1 bolsa cada 30 personas',
  clarifications = NULL
WHERE name ILIKE '%ensalada%';

UPDATE products SET 
  portion_per_person = '1 paquete por bolsa de ensalada',
  clarifications = NULL
WHERE name ILIKE '%feta%' AND category = 'verduras';

UPDATE products SET 
  portion_per_person = '1 baguette por 8 personas',
  clarifications = NULL
WHERE name ILIKE '%pan%' AND category = 'pan';

UPDATE products SET 
  portion_per_person = '250 gr',
  clarifications = 'Entre las 3 carnes elegidas tienen que dar 250 gr'
WHERE category IN ('carnes_clasicas', 'carnes_premium');

