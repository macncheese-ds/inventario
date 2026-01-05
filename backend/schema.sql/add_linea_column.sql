-- Migration script to add "linea" column to gavetas table
-- This field is only used by Mantenimiento area

-- Add the linea column
ALTER TABLE gavetas ADD COLUMN linea VARCHAR(50) DEFAULT NULL;

-- Verify the change
DESCRIBE gavetas;
