# Database migration verification

Status: **prepared, not executed.** The migration script is a draft and must not run until every step below is complete. The database lives on another machine, so none of these steps were run from this environment.

Script: [backend/schema.sql/2026_critical_and_stock_movements.sql](../backend/schema.sql/2026_critical_and_stock_movements.sql)

## What the migration changes

Additive only. No `DROP`, `TRUNCATE`, or `DELETE`. No existing quantities are modified.

1. `gavetas.critico TINYINT(1) NOT NULL DEFAULT 0`. Existing rows become non-critical.
2. New table `stock_movements` with no foreign key on `gaveta_id`, so history survives item deletion. Indexes on `(gaveta_id, created_at)` and `(tipo, created_at)`.
3. `prestamos.gaveta_id INT NULL` plus an index. Existing loans stay NULL. They are not back-filled by name, because duplicate names may exist across gavetas.
4. **Integrity constraints (step 2b):**
   - `gavetas.cantidad` becomes `INT NOT NULL DEFAULT 0`.
   - `CHECK (cantidad >= 0)` named `chk_gavetas_cantidad_no_negativa`.
   - `fk_prestamos_gaveta`: `prestamos.gaveta_id` references `gavetas.id` with `ON DELETE SET NULL`. Deleting an item keeps its loan rows.
   - Step 2b fails without changes if any `cantidad` is NULL or negative. This is why the precheck must return 0.
5. `cambios(area, fecha_hora)` index for history queries. Additive; no rows change.
6. `BASELINE` rows: one `stock_movements` row per item with `cantidad_delta = 0`, recording the current stock as the starting point. Guarded by `NOT EXISTS`, so re-running it does not duplicate rows.
7. **Area and location normalization (steps 4a to 4f):**
   - `areas` (one row per area name, unique, case-insensitive). Seeded with `SMT` and `Ensamble`, then filled from the distinct trimmed `gavetas.area` values. Case variants such as `ENSAMBLE` and `Ensamble` collapse into one row.
   - `ubicaciones` (one row per gaveta inside an area, unique on `(area_id, nombre)`).
   - `gavetas.area_id` and `gavetas.ubicacion_id` (nullable, with FKs added only after verification 4e returns 0).
   - The text columns `gavetas.area`, `gavetas.gaveta`, `prestamos.area`, `prestamos.gaveta`, `cambios.area`, and `gavetas.linea` are **not modified**. `area_id` is the new source of truth for filtering. The text stays for compatibility and history.
   - Rows with an empty area keep `area_id` NULL. They stay visible to users as before (unassigned rows).

After step 2b, the application cannot store negative stock. All three write paths (`items` PUT, `items` decrement, and loans) reject results below zero, and no caller passes `allowNegative: true`. The `stock_negativo` UI state can no longer be produced by the app; it remains only as a defensive state.

The empty tables (`registros`, `solicitudes`, `estado`) are **kept**. This was the owner's decision, so the migration does not drop them. See [Phase C](#phase-c-gated-cleanup-not-part-of-this-migration), which is not planned.

## Assumptions, now verified against the dump (`1.sql`, taken 2026-10-18 22:33:45)

| Item | Live value | Impact on the migration |
|---|---|---|
| MySQL version | 8.0.44 | `DATETIME(3)` and `CURRENT_TIMESTAMP(3)` supported. |
| Charset / collation | `utf8mb4` / `utf8mb4_0900_ai_ci` on all tables | The script uses the same collation. (The draft used `utf8mb4_unicode_ci`; corrected.) |
| `gavetas` rows | 2256 | Baseline inserts 2256 rows. |
| `gavetas.cantidad` | `int DEFAULT NULL` (nullable) | Baseline uses `COALESCE(cantidad, 0)`. Step 2b makes it `NOT NULL DEFAULT 0` after the precheck. Current NULL count: 0. |
| Negative stock | 0 rows | No `stock_negativo` items at migration time, so the CHECK in step 2b can be added. |
| `gavetas.id` and `prestamos.gaveta_id` types | Both `int` (signed) | The FK types match. |
| `cambios` indexes | Only `PRIMARY KEY (id)`; 8111 rows | Adds `idx_cambios_area_fecha`. |
| `gavetas.linea` | `varchar(50)` present | `critico` is added `AFTER linea` as scripted. |
| `prestamos` PK | `id int` | Used only for documentation. The migration does not reference it. |
| `prestamos` rows | 0 (no data in dump) | No legacy loans to link. `gaveta_id` NULL is unused. |
| `orders` | Exists, FK `gaveta_id` ON DELETE CASCADE, 0 rows | Not touched. Still used by the order flag in `items.js`. |
| `estado`, `registros`, `solicitudes` | Exist, 0 rows, not referenced in `backend/src` | Still not dropped. Candidates for removal only after a second confirmation. |
| `cambios` (audit log) | 8111 auto-increment, has data | Not touched. Read by `historial.js`. |
| `critico`, `stock_movements` | Absent from the dump | Migration has not been applied yet. |

Still unverified: the live `SQL_MODE` (dump sets `NO_AUTO_VALUE_ON_ZERO` only inside the dump file, not the server default). The migration is written to succeed under strict mode.


## Step 1: Information to collect from the database machine (read-only)

Run these on the machine that hosts MySQL. Send the output back before any migration step.

```sql
SELECT VERSION();
SHOW CREATE TABLE gavetas\G
SHOW CREATE TABLE prestamos\G
SHOW TABLES;
SELECT COUNT(*) FROM gavetas;
SELECT COUNT(*) FROM prestamos;
```

From the shell, schema-only dump (no data):

```
mysqldump --no-data --routines --triggers -u <user> -p <database> > schema-before.sql
```

## Step 2: Backup (required before any DDL)

```
mysqldump --single-transaction --routines --triggers -u <user> -p <database> > backup-before-2026-critical.sql
```

Verify the backup:

1. File size is non-zero and plausible for the row counts.
2. Restore the backup into a scratch database and run the row count queries from step 1 there. Counts must match.

Do not continue until the restore check passes.

## Step 3: Pre-migration checks (read-only)

```sql
-- Column absent before migration
SELECT COUNT(*) AS critico_existe
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gavetas' AND COLUMN_NAME = 'critico';

-- Table absent before migration
SELECT COUNT(*) AS movimientos_existe
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stock_movements';

-- BLOCKER for step 2b: NULL or negative stock must be 0
SELECT COUNT(*) AS invalidos FROM gavetas WHERE cantidad IS NULL OR cantidad < 0;

-- Current row count (for comparison after migration)
SELECT COUNT(*) AS items FROM gavetas;
```

Expected: `critico_existe = 0`, `movimientos_existe = 0`, `invalidos = 0`.

If `invalidos > 0`, **stop**. Do not run step 2b. List the rows with `SELECT id, ndp, articulo, cantidad FROM gavetas WHERE cantidad IS NULL OR cantidad < 0;`, correct them with a reviewed `UPDATE` (with a fresh backup), and run the precheck again.

## Step 4: Run the migration

Run on a **scratch copy first**. Then run on production during a window with no active writes.

1. Execute the script one statement block at a time. Each `ALTER` and `CREATE` commits implicitly, so a partial run is possible.
2. Stop on any error. Do not retry blindly.
3. Step 2b (`MODIFY cantidad NOT NULL` + `CHECK` + FK) is the only step that can fail on data. In strict mode, MySQL rejects it and leaves the table unchanged. If it fails, the earlier steps (1, 2, 3, 4) are already applied and safe to keep. Fix the data, then run from step 2b onward.
4. Step 4f (the FKs on `gavetas.area_id` and `gavetas.ubicacion_id`) must not run until the step 4e queries both return 0. If either returns more than 0, stop and check the rows listed by the query. Do not bypass it.

## Step 5: Post-migration validation (read-only)

```sql
-- Column exists with default 0
SHOW COLUMNS FROM gavetas LIKE 'critico';

-- Every existing row is non-critical
SELECT COUNT(*) AS criticos FROM gavetas WHERE critico <> 0;   -- expect 0

-- One BASELINE per item
SELECT COUNT(*) AS items FROM gavetas;
SELECT COUNT(DISTINCT gaveta_id) AS con_baseline
FROM stock_movements WHERE tipo = 'BASELINE';                 -- expect equals items

-- No duplicate baselines
SELECT gaveta_id, COUNT(*) c FROM stock_movements
WHERE tipo = 'BASELINE' GROUP BY gaveta_id HAVING c > 1;      -- expect no rows

-- Baseline matches current stock
SELECT COUNT(*) AS mismatches
FROM gavetas g
JOIN stock_movements m ON m.gaveta_id = g.id AND m.tipo = 'BASELINE'
WHERE m.cantidad_despues <> g.cantidad;                        -- expect 0

-- Loans: column exists, existing rows NULL
SELECT COUNT(*) AS total, SUM(gaveta_id IS NULL) AS sin_vinculo FROM prestamos;

-- Constraints in place
SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
  AND CONSTRAINT_NAME IN ('chk_gavetas_cantidad_no_negativa', 'fk_prestamos_gaveta');  -- expect 2 rows
SELECT IS_NULLABLE, COLUMN_DEFAULT FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gavetas' AND COLUMN_NAME = 'cantidad';  -- expect NO, 0

-- Index on audit log
SHOW INDEX FROM cambios WHERE Key_name = 'idx_cambios_area_fecha';  -- expect 2 rows
```

-- Normalization: both must be 0
SELECT COUNT(*) AS sin_area_id FROM gavetas
 WHERE TRIM(COALESCE(area, '')) <> '' AND area_id IS NULL;
SELECT COUNT(*) AS sin_ubicacion_id FROM gavetas
 WHERE area_id IS NOT NULL AND TRIM(COALESCE(gaveta, '')) <> '' AND ubicacion_id IS NULL;

-- Normalization: area catalog. On the dump the expected set is SMT and Ensamble; confirm on the live database
SELECT id, nombre FROM areas ORDER BY id;

-- Normalization: FKs present
SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
  AND CONSTRAINT_NAME IN ('fk_gavetas_area', 'fk_gavetas_ubicacion', 'fk_ubicaciones_area');  -- expect 3 rows
```

Compare row counts with the pre-migration numbers from step 3. They must be identical. The text columns (`gavetas.area`, `gavetas.gaveta`) must also be unchanged: compare a checksum taken before and after.

## Step 6: Cutover order

1. Announce a short window. Stop writes.
2. Take the backup (step 2).
3. Run the migration (step 4).
4. Run validation (step 5).
5. Deploy the backend that uses the new columns and tables.
6. Start the frontend and run the manual checklist in [stock-depletion-estimate.md](./stock-depletion-estimate.md).

**The migration must run before the new backend deploys.** New `prestamos` inserts and `stock_movements` writes will fail against the old schema.

## Rollback

- **Before deploying the new backend, but after step 2b:** the old backend is *not* fully compatible. Its `POST /api/items` inserts `cantidad` as given, so a request without a quantity now fails on the NOT NULL column. Either keep the new backend deployed, or roll back the constraints (below) before restarting the old code.
- **Roll back the constraints only** (keeps history and the critical flag):
  ```sql
  ALTER TABLE prestamos DROP FOREIGN KEY fk_prestamos_gaveta;
  ALTER TABLE gavetas DROP CHECK chk_gavetas_cantidad_no_negativa;
  ALTER TABLE gavetas MODIFY COLUMN cantidad INT NULL DEFAULT NULL;
  ALTER TABLE cambios DROP INDEX idx_cambios_area_fecha;
  ```
- **After deploying the new backend, if a problem is found:**
  1. Stop the new backend.
  2. Roll back the constraints above, then redeploy the previous backend.
  3. Remove the additions only if necessary. Order matters: the FK must be dropped before its column.
     ```sql
     ALTER TABLE prestamos DROP FOREIGN KEY fk_prestamos_gaveta;  -- skip if already dropped
     ALTER TABLE prestamos DROP INDEX idx_prestamos_gaveta_id, DROP COLUMN gaveta_id;
     DROP TABLE stock_movements;
     ALTER TABLE gavetas DROP COLUMN critico;
     ```
     Run these only after a fresh backup. Dropping `stock_movements` deletes all history recorded since cutover.
- **Roll back the normalization** (removes only the new catalog and columns; text columns were never changed). Order matters: FKs first, then columns, then `ubicaciones` before `areas`:
  ```sql
  ALTER TABLE gavetas DROP FOREIGN KEY fk_gavetas_ubicacion, DROP FOREIGN KEY fk_gavetas_area;
  ALTER TABLE gavetas DROP COLUMN ubicacion_id, DROP COLUMN area_id;
  DROP TABLE ubicaciones;
  DROP TABLE areas;
  ```
  Any `area_id` or `ubicacion_id` written after cutover is lost. The text `gavetas.area` and `gavetas.gaveta` still hold the same values, so the old backend keeps working.
- **Full restore:** restore `backup-before-2026-critical.sql` into a clean database. Changes made after the backup are lost unless writes were stopped.

## Phase C: gated cleanup (not part of this migration)

**Status: not planned.** The owner decided to keep these empty tables. The text below is kept only as a reference for a possible future cleanup that would need its own approval. These tables are empty in the dump and not referenced by `backend/src`. Dropping them is irreversible without the backup, so it is kept out of the migration script and must be approved separately.

| Table | Rows (dump) | Evidence it is unused |
|---|---|---|
| `registros` | 0 | Not referenced in `backend/src`. |
| `solicitudes` | 0 | Not referenced in `backend/src`. |
| `estado` | 0 | Only the name `estado` appears in `consumption.js` as a response field, not as a table. |

Gate before running anything from phase C:

1. Re-check the row counts on the live database. All must still be 0.
2. Take a fresh backup and verify it with a restore test (step 2).
3. Get explicit approval from the owner after the cutover has been stable for a period they choose.

```sql
-- Run only after the gate above passes. Not part of 2026_critical_and_stock_movements.sql.
DROP TABLE registros;
DROP TABLE solicitudes;
DROP TABLE estado;
```

## Compatibility notes

- The old `prestamos` return logic matched by item name. The new code uses `gaveta_id` and falls back to name when it is NULL. Repeated names across gavetas can still match the wrong row in the legacy path.
- Schema drift in [backend/schema.sql/init.sql](../backend/schema.sql/init.sql) means that file should not be used as the baseline. Use the live `SHOW CREATE TABLE` output.

## Explicit statement

Nothing in this document was executed. No SQL ran against the database, which is on another machine, and no backend or frontend build or test was run. The checks above were done statically against the dump `1.sql`. The owner must run steps 2 to 5 on the live database before deploying.

No migration, SQL statement, installation, build, test, or deployment command was executed while preparing this document or the code changes.
