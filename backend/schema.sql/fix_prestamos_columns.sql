-- Migration: Add missing columns to prestamos table

-- Add ndp column
ALTER TABLE prestamos ADD COLUMN ndp VARCHAR(100) AFTER articulo;

-- Add gaveta column
ALTER TABLE prestamos ADD COLUMN gaveta VARCHAR(50) AFTER ndp;

-- Add empleado1 column (name of person who made the loan)
ALTER TABLE prestamos ADD COLUMN empleado1 VARCHAR(100) AFTER cantidad;

-- Add fecha_prestamo column if not exists
ALTER TABLE prestamos ADD COLUMN fecha_prestamo DATETIME DEFAULT CURRENT_TIMESTAMP AFTER empleado1;

-- Verify the changes
DESCRIBE prestamos;
