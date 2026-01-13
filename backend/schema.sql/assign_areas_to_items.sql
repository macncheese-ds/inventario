-- Script para asignar áreas a items en gavetas basándose en criterios lógicos
-- IMPORTANTE: Ajusta estos criterios según tu lógica de negocio

-- Opción 1: Si tienes un patrón en los nombres de los artículos
-- UPDATE gavetas 
-- SET area = 'ENSAMBLE' 
-- WHERE articulo LIKE '%SMT%' OR equipo LIKE '%FUJI%' OR equipo LIKE '%YAMAHA%';

-- Opción 2: Si tienes un patrón en los números de gaveta
-- Por ejemplo: gavetas 1-4 son Ensamble, gavetas 5-9 son SMT
-- UPDATE gavetas 
-- SET area = 'ENSAMBLE' 
-- WHERE CAST(gaveta AS UNSIGNED) BETWEEN 1 AND 4;

-- UPDATE gavetas 
-- SET area = 'SMT' 
-- WHERE CAST(gaveta AS UNSIGNED) BETWEEN 5 AND 9;

-- Opción 3: Asignar todos los items sin área a una área por defecto (RECOMENDADO HACER MANUALMENTE)
-- UPDATE gavetas 
-- SET area = 'ENSAMBLE' 
-- WHERE area IS NULL OR area = '';

-- Para ver qué items tienen área asignada actualmente:
SELECT 'Items actuales por área:' AS info;
SELECT COALESCE(area, 'SIN AREA') AS area, COUNT(*) as total, 
       GROUP_CONCAT(DISTINCT equipo LIMIT 10) as equipos
FROM gavetas
GROUP BY area;

-- IMPORTANTE: 
-- 1. Revisa qué gavetas/equipos pertenecen a cada área
-- 2. Ejecuta los UPDATE que correspondan
-- 3. Verifica que TODOS los items tengan un área asignada
SELECT COUNT(*) as items_sin_area FROM gavetas WHERE area IS NULL OR area = '';
