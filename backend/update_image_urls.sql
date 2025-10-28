-- Script para actualizar las URLs de imágenes de la IP antigua a la nueva
-- Base de datos: inventario
-- Fecha: 2025-10-27

USE inventario;

-- Ver las URLs actuales antes del cambio
SELECT id, nombre, imagen 
FROM items 
WHERE imagen LIKE '%10.229.52.84%'
LIMIT 10;

-- Actualizar las URLs de imágenes de la IP antigua a la nueva
UPDATE items 
SET imagen = REPLACE(imagen, 'http://10.229.52.84:4000', 'http://10.229.52.220:4000')
WHERE imagen LIKE '%10.229.52.84%';

-- Verificar los cambios
SELECT id, nombre, imagen 
FROM items 
WHERE imagen LIKE '%10.229.52.220%'
LIMIT 10;

-- Resumen de cambios
SELECT 
    'Total registros actualizados' as descripcion,
    COUNT(*) as cantidad
FROM items 
WHERE imagen LIKE '%10.229.52.220%';
