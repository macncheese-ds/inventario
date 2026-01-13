-- Script de validación y población de datos por área
-- Este script verifica que todo esté correctamente configurado

-- 1. VERIFICAR que las columnas existen en inventario
SELECT 'Validación: Verificar columnas en gavetas' AS step;
DESCRIBE gavetas;

SELECT 'Validación: Verificar columnas en cambios' AS step;
DESCRIBE cambios;

SELECT 'Validación: Verificar columnas en prestamos' AS step;
DESCRIBE prestamos;

-- 2. VERIFICAR que los usuarios tienen área asignado
SELECT 'Validación: Usuarios con área' AS step;
SELECT id, nombre, usuario, num_empleado, rol, area FROM users WHERE area IS NOT NULL LIMIT 10;

-- 3. CONTAR items por área
SELECT 'Validación: Items por área' AS step;
SELECT COALESCE(area, 'SIN AREA') AS area, COUNT(*) as total FROM gavetas GROUP BY area;

-- 4. CONTAR usuarios por área
SELECT 'Validación: Usuarios por área' AS step;
SELECT COALESCE(area, 'SIN AREA') AS area, COUNT(*) as total, GROUP_CONCAT(nombre) as nombres 
FROM users GROUP BY area;

-- 5. DATOS IMPORTANTES
SELECT '=== RESUMEN ===' AS info;
SELECT CONCAT(
  'Total gavetas: ', (SELECT COUNT(*) FROM gavetas),
  ', Total usuarios: ', (SELECT COUNT(*) FROM users),
  ', Total cambios: ', (SELECT COUNT(*) FROM cambios)
) AS counts;
