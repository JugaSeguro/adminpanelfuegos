-- Script para verificar y corregir la columna status en catering_orders
-- Este script asegura que la columna status acepte los valores: 'pending', 'sent', 'approved', 'rejected'

-- Paso 1: Verificar el tipo actual de la columna status
DO $$
DECLARE
    current_type text;
BEGIN
    SELECT data_type INTO current_type
    FROM information_schema.columns
    WHERE table_name = 'catering_orders' 
    AND column_name = 'status';
    
    RAISE NOTICE 'Tipo actual de status: %', current_type;
END $$;

-- Paso 2: Si la columna es un ENUM, modificarlo
-- Primero, verificar si existe el tipo order_status
DO $$
BEGIN
    -- Si existe un ENUM llamado order_status, lo eliminamos y recreamos
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        -- Eliminar la columna temporalmente (si no tiene datos críticos)
        -- O mejor: alterar el tipo directamente
        
        -- Opción 1: Si no hay datos importantes, recrear el tipo
        -- DROP TYPE IF EXISTS order_status CASCADE;
        
        -- Opción 2: Agregar valores al ENUM existente (PostgreSQL 9.1+)
        -- ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'sent';
        -- ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'rejected';
        
        -- Opción 3: Convertir a VARCHAR (más flexible)
        ALTER TABLE catering_orders 
        ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
        
        DROP TYPE IF EXISTS order_status;
        
        RAISE NOTICE 'Tipo order_status convertido a VARCHAR';
    END IF;
END $$;

-- Paso 3: Asegurar que la columna status sea VARCHAR con los valores correctos
-- Si la columna no existe o es de otro tipo, crearla/modificarla
DO $$
BEGIN
    -- Si la columna no existe, crearla
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catering_orders' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE catering_orders 
        ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
        
        RAISE NOTICE 'Columna status creada';
    ELSE
        -- Si existe, asegurar que sea VARCHAR
        ALTER TABLE catering_orders 
        ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
        
        -- Asegurar el valor por defecto
        ALTER TABLE catering_orders 
        ALTER COLUMN status SET DEFAULT 'pending';
        
        RAISE NOTICE 'Columna status actualizada a VARCHAR';
    END IF;
END $$;

-- Paso 4: Agregar constraint CHECK para validar los valores permitidos
DO $$
BEGIN
    -- Eliminar constraint anterior si existe
    ALTER TABLE catering_orders 
    DROP CONSTRAINT IF EXISTS check_status_values;
    
    -- Crear nuevo constraint con los valores correctos
    ALTER TABLE catering_orders 
    ADD CONSTRAINT check_status_values 
    CHECK (status IN ('pending', 'sent', 'approved', 'rejected'));
    
    RAISE NOTICE 'Constraint de validación agregado';
END $$;

-- Paso 5: Crear función para actualizar updated_at (fuera del bloque DO)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 6: Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_catering_orders_updated_at ON catering_orders;

CREATE TRIGGER update_catering_orders_updated_at
BEFORE UPDATE ON catering_orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Paso 7: Verificar resultado final
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'catering_orders' 
AND column_name IN ('status', 'updated_at')
ORDER BY column_name;

-- Mostrar constraint
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'catering_orders' 
AND tc.constraint_type = 'CHECK'
AND tc.constraint_name = 'check_status_values';

