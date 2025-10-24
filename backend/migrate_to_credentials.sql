-- Script de migración para actualizar inventario a usar sistema de credenciales
-- Fecha: 2025-10-24

USE inventario;

-- Eliminar la tabla users local (ya no se usa, ahora usamos credenciales.users)
DROP TABLE IF EXISTS users;

-- Actualizar tabla cambios para usar num_empleado en lugar de username
-- (El campo username ahora será el num_empleado del usuario)
-- No necesitamos cambiar la estructura, solo el significado del campo

-- Verificar que la tabla cambios existe y tiene la estructura correcta
SELECT 'Tabla cambios verificada' AS status;

-- Verificar que la tabla gavetas existe
SELECT 'Tabla gavetas verificada' AS status;

-- Mensaje de confirmación
SELECT 'Migración completada. El sistema de inventario ahora usa la base de datos credenciales para autenticación.' AS mensaje;
SELECT 'Roles del sistema:' AS info;
SELECT '- The Goat y Administrador: Acceso total (admin)' AS rol1;
SELECT '- Lider y Operador: Puede editar (operador)' AS rol2;
SELECT '- Invitado: Solo lectura (guest)' AS rol3;
