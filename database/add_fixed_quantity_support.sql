-- Script para agregar soporte para cantidades fijas en ingredientes del calculador
-- Ejecuta este script en el SQL Editor de Supabase

ALTER TABLE event_calculation_ingredients 
ADD COLUMN IF NOT EXISTS is_fixed_quantity BOOLEAN DEFAULT false;
