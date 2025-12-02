-- Script para verificar y corregir las políticas RLS (Row Level Security) de catering_orders
-- Esto permite que las actualizaciones funcionen correctamente

-- Paso 1: Verificar si RLS está habilitado
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'catering_orders';

-- Paso 2: Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'catering_orders';

-- Paso 3: Eliminar todas las políticas existentes primero
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'catering_orders'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.catering_orders', pol.policyname);
    END LOOP;
END $$;

-- Habilitar RLS
ALTER TABLE catering_orders ENABLE ROW LEVEL SECURITY;

-- Crear políticas permisivas para TODOS los usuarios (anon, authenticated, public)
-- Esto permite que el Panel Admin funcione sin autenticación

-- Política para SELECT (lectura) - para todos
CREATE POLICY "Enable read access for all users"
ON catering_orders
FOR SELECT
TO anon, authenticated, public
USING (true);

-- Política para INSERT (inserción) - para todos
CREATE POLICY "Enable insert access for all users"
ON catering_orders
FOR INSERT
TO anon, authenticated, public
WITH CHECK (true);

-- Política para UPDATE (actualización) - para todos (IMPORTANTE)
CREATE POLICY "Enable update access for all users"
ON catering_orders
FOR UPDATE
TO anon, authenticated, public
USING (true)
WITH CHECK (true);

-- Política para DELETE (eliminación) - para todos
CREATE POLICY "Enable delete access for all users"
ON catering_orders
FOR DELETE
TO anon, authenticated, public
USING (true);

-- Paso 4: Verificar que las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'catering_orders'
ORDER BY policyname;

-- Paso 5: Probar una actualización manual para verificar que funciona
-- (Descomentar para probar)
/*
UPDATE catering_orders 
SET status = 'approved', updated_at = NOW()
WHERE id = 'b949f1a7-547d-47ef-b4e5-877e54030bc5'
RETURNING id, name, status, updated_at;
*/

