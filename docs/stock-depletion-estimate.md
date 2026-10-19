# Stock depletion estimate

Status: implemented in code, **not executed**. No tests, builds, or SQL were run against a database. Behavior must be verified manually (see the checklist at the end).

Source: [backend/src/services/consumption.js](../backend/src/services/consumption.js), served by `GET /api/items/consumo`, shown in [frontend/src/pages/Inventory.jsx](../frontend/src/pages/Inventory.jsx).

## Formula

For each item:

```
dias_observados   = days between max(first movement date, CURDATE() - (N-1)) and CURDATE(), inclusive
consumo_periodo   = sum of |cantidad_delta| for consumption movements in the window
promedio_diario   = consumo_periodo / dias_observados          (rounded to 2 decimals)
dias_restantes    = stock_actual / promedio_diario              (rounded to 1 decimal)
fecha_agotamiento = CURDATE() + floor(dias_restantes)           (YYYY-MM-DD)
```

- `N` is the observation window in calendar days. Default `DEFAULT_OBSERVATION_DAYS = 30`. The API caps it at 1 to 365.
- Zero-consumption days count in `dias_observados`. The average is taken over the full observed period, not only the days with activity.
- Dates are computed by MySQL using `CURDATE()`. The result depends on the MySQL session timezone.

## Movement types

Source of truth: the `stock_movements` table, written in the same transaction as each stock change.

| `tipo` | Counted as consumption | Notes |
|---|---|---|
| `DECREMENT` | Yes, when `cantidad_delta < 0` | "Quitar unidades" button in the table. |
| `UPDATE` | Yes, only when `cantidad_delta < 0` | Manual edit that lowers stock. |
| `UPDATE` (increase) | No | Stock added manually. |
| `ALTA` | No | Item created. |
| `BAJA` | No | Item deleted. |
| `PRESTAMO` | No | Loan. Logged, but the item is not consumed. |
| `DEVOLUCION` | No | Loan return. Logged only. |
| `BASELINE` | No | Opening snapshot from the migration. |

## Observation period and minimum history

- Window: last `N = 30` calendar days by default.
- `MIN_OBSERVED_DAYS = 7`. Approved by the owner. Items with fewer observed days get `historial_insuficiente`.
- `seguimiento_desde` is the first movement date. If the item has been tracked for less than the window, `historial_parcial` is set and the estimate is based on the shorter period.

## Scope

- Estimates are computed per item for the requesting user's area, as implemented by the `consumo` endpoint. The area match uses `gavetas.area_id` (the `areas` catalog), so case variants such as `ENSAMBLE` and `Ensamble` are treated as one area. Items without an area stay visible, as before.
- Results are returned as a map keyed by item id. The frontend looks them up with `String(item.id)`.

## Units

- No unit of measure exists in the schema. Values are shown as "unidades" (inventory units). This is unverified against the live database.

## Rounding

- `promedio_diario`: 2 decimals.
- `dias_restantes`: 1 decimal. Displayed as `~N días` in the table.
- `fecha_agotamiento`: `floor(dias_restantes)` days after today.

## Refresh behavior

- Computed on each request to `GET /api/items/consumo`. There is no cache.
- The frontend fetches it on each `loadItems()` call, which runs on gaveta or search change, and after the items reload that follows edits.

## Fallback states

| `estado` | Shown as | Meaning |
|---|---|---|
| `sin_historial` | Sin historial | No movement recorded for the item. |
| `stock_negativo` | Stock negativo: revisar | Stock below zero. Data needs review. |
| `sin_existencias` | Sin existencias | Stock is 0. Days remaining = 0. |
| `historial_insuficiente` | Historial insuficiente | Fewer than `MIN_OBSERVED_DAYS` observed days. |
| `sin_consumo` | Sin consumo en el periodo | Observed days exist, but no consumption in the window. |
| `ok` | `~N días` with the end date in the tooltip | Estimate available. |

## Localization

- Languages: Spanish (`es`, default), English (`en`), Korean (`ko`). The selector is in the inventory header and the choice is stored in `localStorage` under `inv_lang`.
- UI strings are static files in `frontend/src/i18n/`.
- Item names, equipment, level and TDE text are translated **in the browser only**. The database is not modified and no external service is called.
  1. `frontend/src/i18n/autotranslate.js` uses the browser's on-device Translator API (Chrome/Edge 138+) when available. Changing the language selector lets the browser download the language model once. Results are cached in `localStorage` (`inv_tr_cache_v1`).
  2. If the browser has no Translator API, or the model is not downloaded, `frontend/src/i18n/articulo.js` is used: a glossary of about 150 terms that translates word by word. Words not in the glossary stay in Spanish.
- Limits: the glossary is not machine translation, so word order is not adjusted and Korean output can read awkwardly. The `ko` glossary has not been reviewed by a native speaker. The Translator API is not available in Firefox or Safari, which fall back to the glossary.
- Follow-up options if the quality is not enough: a larger glossary maintained by the team, or a local translation model. Either is a separate decision.

## Known limitations

- **Manual negative edits count as consumption.** An `UPDATE` that lowers stock is treated the same as a consumption. Corrections entered as decreases will inflate the estimate.
- Loans (`PRESTAMO`) are excluded. Items mainly used through loans will show a low or zero estimate.
- The estimate is linear and assumes future use matches the observed period. It is approximate.
- History begins with the migration `BASELINE` rows. Before that, there is no movement history.
- Items with stock that never moved since tracking began show `sin_consumo` even if they were used before tracking.

## Manual verification checklist

1. Run the migration on a backup copy first (see [db-migration-verification.md](./db-migration-verification.md)).
2. Pick an item with known movements in the last 30 days. Compare `consumo_periodo` and `dias_observados` against a SELECT on `stock_movements`.
3. Confirm `promedio_diario = consumo_periodo / dias_observados`.
4. Confirm `dias_restantes = cantidad / promedio_diario`.
5. Confirm an item with a loan only does not count the loan as consumption.
6. Confirm an item with fewer than 7 observed days shows `Historial insuficiente`.
7. Confirm an item with stock 0 shows `Sin existencias`.
8. Confirm the table and the detail modal show the same values.
