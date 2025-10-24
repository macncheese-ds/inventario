-- Script para actualizar el tipo de num_empleado a VARCHAR para soportar letras (ej: 1234A)
-- Fecha: 2025-10-24

USE credenciales;

-- Modificar el tipo de num_empleado de INT a VARCHAR(20)
ALTER TABLE users MODIFY COLUMN num_empleado VARCHAR(20) UNIQUE;

SELECT 'Campo num_empleado actualizado a VARCHAR(20) exitosamente' AS mensaje;
