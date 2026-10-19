// Normalización de áreas y ubicaciones (gaveta dentro de un área).
// Los nombres se comparan sin distinguir mayúsculas ni espacios de borde,
// igual que la collation utf8mb4_0900_ai_ci de las columnas.

export function normalizeName(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

export function esEnsamble(area) {
  return normalizeName(area)?.toLowerCase() === 'ensamble';
}

// Condición SQL para filtrar gavetas por área por id.
// placeholder: ':userArea' (consultas con nombres) o '?' (consultas posicionales).
// Con includeUnassigned, las filas sin área siguen visibles, como antes de la migración.
export function areaVisibleSql(alias, placeholder, { includeUnassigned = true } = {}) {
  const match = `${alias}.area_id = (SELECT a.id FROM areas a WHERE a.nombre = ${placeholder} LIMIT 1)`;
  return includeUnassigned ? `(${match} OR ${alias}.area_id IS NULL)` : match;
}

// Devuelve el id del área por nombre, o null si no existe.
export async function areaIdByName(conn, name) {
  const n = normalizeName(name);
  if (!n) return null;
  const [rows] = await conn.query('SELECT id FROM areas WHERE nombre = ? LIMIT 1', [n]);
  return rows[0] ? rows[0].id : null;
}

// Devuelve el id del área y la crea si no existe. No renombra un área existente.
export async function ensureAreaId(conn, name) {
  const n = normalizeName(name);
  if (!n) return null;
  const [result] = await conn.query(
    'INSERT INTO areas (nombre) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
    [n]
  );
  return result.insertId;
}

// Devuelve el id de la ubicación dentro del área y la crea si no existe.
export async function ensureUbicacionId(conn, areaId, name) {
  const n = normalizeName(name);
  if (!areaId || !n) return null;
  const [result] = await conn.query(
    'INSERT INTO ubicaciones (area_id, nombre) VALUES (?, ?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
    [areaId, n]
  );
  return result.insertId;
}
