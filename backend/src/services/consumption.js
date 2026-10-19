// Estimación de consumo y días restantes por ítem.
// Fórmula, periodo y reglas: ver docs/stock-depletion-estimate.md.
import pool from '../db.js';
import { normalizeName, areaVisibleSql } from '../utils/areas.js';

export const DEFAULT_OBSERVATION_DAYS = 30;
// Mínimo de días calendario observados para calcular una estimación.
export const MIN_OBSERVED_DAYS = 7;
// Solo estos tipos cuentan como consumo, y solo cuando cantidad_delta es negativo.
const CONSUMPTION_TYPES = ['DECREMENT', 'UPDATE'];

function addDays(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function buildEstimate(row, days) {
  const stock = Number(row.cantidad);
  const observed = row.dias_observados == null ? 0 : Number(row.dias_observados);
  const consumed = Number(row.consumido || 0);
  const base = {
    cantidad: stock,
    unidad: 'unidades',
    periodo_dias: days,
    dias_observados: observed,
    seguimiento_desde: row.seguimiento_desde || null,
    historial_parcial: observed < days,
    consumo_periodo: consumed,
    movimientos_consumo: Number(row.movimientos || 0),
    promedio_diario: null,
    dias_restantes: null,
    fecha_agotamiento: null
  };

  if (!row.seguimiento_desde) return { ...base, estado: 'sin_historial' };
  if (stock < 0) return { ...base, estado: 'stock_negativo' };
  if (stock === 0) return { ...base, estado: 'sin_existencias', dias_restantes: 0 };
  if (observed < MIN_OBSERVED_DAYS) return { ...base, estado: 'historial_insuficiente' };
  if (consumed === 0) return { ...base, estado: 'sin_consumo' };

  // Promedio sobre todos los días calendario del periodo, incluidos los días sin consumo.
  // El redondeo se aplica solo al mostrar; la fecha usa el valor sin redondear.
  const dailyAverage = consumed / observed;
  const daysRemaining = stock / dailyAverage;
  return {
    ...base,
    estado: 'ok',
    promedio_diario: Math.round(dailyAverage * 100) / 100,
    dias_restantes: Math.round(daysRemaining * 10) / 10,
    fecha_agotamiento: addDays(row.hoy, Math.floor(daysRemaining))
  };
}

// Devuelve un Map id -> estimación, en una sola consulta agregada (sin consultas por fila).
export async function getConsumptionEstimates({ userArea = null, days = DEFAULT_OBSERVATION_DAYS } = {}) {
  const periodo = Math.min(Math.max(parseInt(days, 10) || DEFAULT_OBSERVATION_DAYS, 1), 365);
  const startOffset = periodo - 1;
  const params = {};
  const where = ['1=1'];
  const areaName = normalizeName(userArea);
  if (areaName) {
    where.push(areaVisibleSql('g', ':userArea'));
    params.userArea = areaName;
  }

  const [rows] = await pool.query(
    `SELECT g.id, g.cantidad,
            DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hoy,
            DATE_FORMAT(f.first_at, '%Y-%m-%d') AS seguimiento_desde,
            DATEDIFF(CURDATE(), GREATEST(DATE(f.first_at), DATE_SUB(CURDATE(), INTERVAL ${startOffset} DAY))) + 1 AS dias_observados,
            c.consumido,
            c.movimientos
       FROM \`gavetas\` g
       LEFT JOIN (
         SELECT gaveta_id, MIN(created_at) AS first_at
           FROM stock_movements
          GROUP BY gaveta_id
       ) f ON f.gaveta_id = g.id
       LEFT JOIN (
         SELECT gaveta_id, SUM(-cantidad_delta) AS consumido, COUNT(*) AS movimientos
           FROM stock_movements
          WHERE tipo IN (${CONSUMPTION_TYPES.map(t => `'${t}'`).join(', ')}) AND cantidad_delta < 0
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL ${startOffset} DAY)
          GROUP BY gaveta_id
       ) c ON c.gaveta_id = g.id
      WHERE ${where.join(' AND ')}`,
    params
  );

  const result = new Map();
  for (const row of rows) {
    result.set(row.id, buildEstimate(row, periodo));
  }
  return result;
}
