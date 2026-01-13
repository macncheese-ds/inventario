-- Migration script to add "area" column to gavetas and prestamos tables
-- This field is used to segregate inventory by work area (Ensamble, SMT, etc.)

-- Add the area column to gavetas
ALTER TABLE gavetas ADD COLUMN area VARCHAR(50) DEFAULT NULL;

-- Add the area column to cambios
ALTER TABLE cambios ADD COLUMN area VARCHAR(50) DEFAULT NULL;

-- Add the area column to prestamos if it doesn't exist
ALTER TABLE prestamos ADD COLUMN area VARCHAR(50) DEFAULT NULL;

-- Verify the changes
DESCRIBE gavetas;
DESCRIBE cambios;
DESCRIBE prestamos;
