-- Migración aditiva: piezas críticas + historial de movimientos de inventario.
--
-- ESTADO: LISTO PARA EJECUTAR tras respaldo verificado. Validado contra el volcado
-- real 1.sql (MySQL 8.0.44, 2256 filas en gavetas, 0 cantidades NULL, 0 negativas,
-- prestamos sin filas, PK prestamos.id, gavetas.cantidad int NULL).
-- Antes de ejecutar: docs/db-migration-verification.md (respaldo y restauración de prueba).
--
-- PRECHECK (ejecutar antes; debe devolver 0):
--   SELECT COUNT(*) AS invalidos FROM gavetas WHERE cantidad IS NULL OR cantidad < 0;
-- Si devuelve > 0, NO ejecutar el paso 2b: corregir los datos primero (ver docs).
--
-- Principios:
--   * Solo agrega columnas, tablas y restricciones. No hay DROP, TRUNCATE ni DELETE.
--   * No modifica cantidades existentes. El paso 2b falla (sin cambios) si hay NULL o negativos.
--  * No modifica texto existente de gavetas.area, gavetas.gaveta, linea, prestamos ni cambios.
--    La normalización agrega areas, ubicaciones y columnas *_id; el texto se conserva.
--   * El bloque BASELINE registra el saldo actual como punto de inicio del
--     historial. Es una fotografía real del momento de la migración; no
--     reconstruye movimientos pasados.
--   * MySQL confirma (commit implícito) cada sentencia DDL. Por eso el script
--     se ejecuta paso a paso y cada paso es seguro de repetir o revertir
--     según docs/db-migration-verification.md.

-- 1) Marca de pieza crítica. 0 = no crítica (valor por defecto para registros existentes).
ALTER TABLE gavetas
  ADD COLUMN critico TINYINT(1) NOT NULL DEFAULT 0 AFTER linea;

-- 2) Historial de movimientos de stock.
--    gaveta_id no tiene llave foránea a propósito: el historial sobrevive si el ítem se elimina.
--    cantidad_delta es negativo para salidas y positivo para entradas.
CREATE TABLE IF NOT EXISTS stock_movements (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  gaveta_id         INT NULL,
  ndp_snapshot      VARCHAR(255) NULL,
  articulo_snapshot VARCHAR(255) NULL,
  area_snapshot     VARCHAR(255) NULL,
  tipo              VARCHAR(20) NOT NULL,
  cantidad_delta    INT NOT NULL,
  cantidad_antes    INT NOT NULL,
  cantidad_despues  INT NOT NULL,
  referencia_id     INT NULL,
  actor             VARCHAR(255) NULL,
  created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_sm_gaveta_fecha (gaveta_id, created_at),
  KEY idx_sm_tipo_fecha (tipo, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3) Vínculo de préstamo con el ítem exacto (evita buscar por nombre al devolver).
--    Los préstamos existentes quedan con NULL; no se rellenan por nombre porque
--    pueden existir artículos con el mismo nombre en distintas gavetas.
ALTER TABLE prestamos
  ADD COLUMN gaveta_id INT NULL AFTER gaveta,
  ADD KEY idx_prestamos_gaveta_id (gaveta_id);

-- 2b) Restricciones de integridad en gavetas.cantidad y prestamos.gaveta_id.
--     Requiere el PRECHECK en 0. Si hay NULL o negativos, MySQL rechaza el ALTER
--     (modo estricto) y no cambia nada.
ALTER TABLE gavetas
  MODIFY COLUMN cantidad INT NOT NULL DEFAULT 0,
  ADD CONSTRAINT chk_gavetas_cantidad_no_negativa CHECK (cantidad >= 0);

-- Préstamos: si el ítem se elimina, el préstamo se conserva con gaveta_id en NULL.
ALTER TABLE prestamos
  ADD CONSTRAINT fk_prestamos_gaveta FOREIGN KEY (gaveta_id)
    REFERENCES gavetas (id) ON DELETE SET NULL;

-- 4) Índice para consultas de historial por área y fecha (tabla de auditoría existente).
ALTER TABLE cambios
  ADD KEY idx_cambios_area_fecha (area, fecha_hora);

-- 4a) Catálogo de áreas. Nombres únicos sin distinguir mayúsculas (collation _ci).
--     Primero se insertan los nombres canónicos 'SMT' y 'Ensamble' para que las
--     variantes 'ENSAMBLE' y 'Ensamble' del volcado se unifiquen con el nombre que usa el código.
--     gavetas.area (texto) no se modifica.
CREATE TABLE IF NOT EXISTS areas (
  id     INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(200) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_areas_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO areas (nombre) VALUES ('SMT'), ('Ensamble')
  ON DUPLICATE KEY UPDATE areas.nombre = areas.nombre;

INSERT INTO areas (nombre)
SELECT DISTINCT TRIM(g.area)
  FROM gavetas g
 WHERE TRIM(COALESCE(g.area, '')) <> ''
ON DUPLICATE KEY UPDATE areas.nombre = areas.nombre;

-- 4b) Catálogo de ubicaciones: una gaveta dentro de un área. Único por (área, nombre).
--     Con collation _ci, 'Gaveta 425' y 'GAVETA 425' son la misma ubicación.
--     El nombre mostrado es el primero que encuentra el motor; es solo cosmético.
CREATE TABLE IF NOT EXISTS ubicaciones (
  id      INT NOT NULL AUTO_INCREMENT,
  area_id INT NOT NULL,
  nombre  VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ubicaciones_area_nombre (area_id, nombre),
  CONSTRAINT fk_ubicaciones_area FOREIGN KEY (area_id) REFERENCES areas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO ubicaciones (area_id, nombre)
SELECT DISTINCT a.id, TRIM(g.gaveta)
  FROM gavetas g
  JOIN areas a ON a.nombre = TRIM(g.area)
 WHERE TRIM(COALESCE(g.gaveta, '')) <> ''
ON DUPLICATE KEY UPDATE ubicaciones.nombre = ubicaciones.nombre;

-- 4c) Columnas nuevas en gavetas. Quedan en NULL hasta el backfill; las filas sin área siguen en NULL.
ALTER TABLE gavetas
  ADD COLUMN area_id INT NULL AFTER critico,
  ADD COLUMN ubicacion_id INT NULL AFTER area_id,
  ADD KEY idx_gavetas_area_id (area_id),
  ADD KEY idx_gavetas_ubicacion_id (ubicacion_id);

-- 4d) Backfill desde el texto existente. Solo escribe donde la columna nueva está en NULL.
UPDATE gavetas g
  JOIN areas a ON a.nombre = TRIM(g.area)
   SET g.area_id = a.id
 WHERE g.area_id IS NULL AND TRIM(COALESCE(g.area, '')) <> '';

UPDATE gavetas g
  JOIN ubicaciones u ON u.area_id = g.area_id AND u.nombre = TRIM(g.gaveta)
   SET g.ubicacion_id = u.id
 WHERE g.ubicacion_id IS NULL AND TRIM(COALESCE(g.gaveta, '')) <> '';

-- 4e) VERIFICACIÓN (solo lectura). Ambas consultas deben devolver 0 antes de ejecutar 4f:
--   SELECT COUNT(*) AS sin_area_id FROM gavetas
--    WHERE TRIM(COALESCE(area, '')) <> '' AND area_id IS NULL;
--   SELECT COUNT(*) AS sin_ubicacion_id FROM gavetas
--    WHERE area_id IS NOT NULL AND TRIM(COALESCE(gaveta, '')) <> '' AND ubicacion_id IS NULL;

-- 4f) Llaves foráneas de gavetas. Ejecutar solo con la verificación 4e en 0.
ALTER TABLE gavetas
  ADD CONSTRAINT fk_gavetas_area FOREIGN KEY (area_id) REFERENCES areas (id),
  ADD CONSTRAINT fk_gavetas_ubicacion FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones (id) ON DELETE SET NULL;

-- 5) Baseline: un movimiento BASELINE por ítem con el saldo vigente al migrar.
--    delta 0: no cuenta como consumo. Es idempotente (no duplica si se vuelve a ejecutar).
INSERT INTO stock_movements
  (gaveta_id, ndp_snapshot, articulo_snapshot, area_snapshot, tipo,
   cantidad_delta, cantidad_antes, cantidad_despues, referencia_id, actor, created_at)
SELECT g.id, g.ndp, g.articulo, g.area, 'BASELINE',
       0, COALESCE(g.cantidad, 0), COALESCE(g.cantidad, 0), NULL, 'MIGRACION', NOW(3)
  FROM gavetas g
 WHERE NOT EXISTS (
   SELECT 1 FROM stock_movements sm
    WHERE sm.gaveta_id = g.id AND sm.tipo = 'BASELINE'
 );
