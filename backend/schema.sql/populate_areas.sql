-- Script para asignar áreas a items basándose en criterios específicos
-- AJUSTA ESTOS CRITERIOS SEGÚN TU LÓGICA DE NEGOCIO

-- Ver resumen actual
SELECT 'Resumen actual de áreas:' AS step;
SELECT COALESCE(area, 'SIN AREA') AS area, COUNT(*) as total FROM gavetas GROUP BY area;

-- OPCIÓN 1: Asignar por patrón de equipo (SMT vs Ensamble)
-- Equipos típicos de SMT: FUJI, YAMAHA, ZENITH UHS, HELLER, KIC
-- Equipos típicos de Ensamble: AOI, DEK, Manuales, Refacciones generales

UPDATE gavetas 
SET area = 'SMT' 
WHERE (equipo LIKE '%FUJI%' 
   OR equipo LIKE '%YAMAHA%' 
   OR equipo LIKE '%ZENITH%'
   OR equipo LIKE '%HELLER%'
   OR equipo LIKE '%KIC%'
   OR equipo LIKE '%SMT%'
   OR equipo LIKE '%SOLDERING%')
  AND (area IS NULL OR area = '');

UPDATE gavetas 
SET area = 'ENSAMBLE' 
WHERE (equipo LIKE '%AOI%' 
   OR equipo LIKE '%DEK%'
   OR equipo LIKE '%ASSEMBLY%'
   OR articulo LIKE '%OVEROL%'
   OR articulo LIKE '%CUBREBOCAS%'
   OR articulo LIKE '%GUANTE%'
   OR articulo LIKE '%TAPE%'
   OR articulo LIKE '%CINTA%')
  AND (area IS NULL OR area = '');

-- Cualquier item que siga sin área, asignar por defecto a ENSAMBLE
UPDATE gavetas 
SET area = 'ENSAMBLE' 
WHERE area IS NULL OR area = '';

-- Verificar el resultado
SELECT 'Resultado después de asignación:' AS step;
SELECT COALESCE(area, 'UNKNOWN') AS area, COUNT(*) as total FROM gavetas GROUP BY area;

-- Ver ejemplos de items en cada área
SELECT 'Ejemplos de ENSAMBLE:' AS category;
SELECT gaveta, articulo, equipo, area FROM gavetas WHERE area = 'ENSAMBLE' LIMIT 5;

SELECT 'Ejemplos de SMT:' AS category;
SELECT gaveta, articulo, equipo, area FROM gavetas WHERE area = 'SMT' LIMIT 5;
