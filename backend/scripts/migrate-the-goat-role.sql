-- Migration script to change "The Goat" role to "Invitado"
-- Run this against the credenciales database to update any users with the old role

-- First, let's see which users have "The Goat" role
SELECT id, nombre, usuario, num_empleado, rol 
FROM users 
WHERE rol = 'The Goat';

-- Update all users with "The Goat" role to "Invitado"
UPDATE users 
SET rol = 'Invitado' 
WHERE rol = 'The Goat';

-- Verify the change
SELECT id, nombre, usuario, num_empleado, rol 
FROM users 
WHERE rol = 'Invitado';
