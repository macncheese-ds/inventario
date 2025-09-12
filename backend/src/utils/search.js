// Busca por ndp, articulo o equipo en la tabla `gavetas`
export function buildSearchClause(q, alias = 'g') {
  if (!q) return { clause: '', params: {} };
  return {
    clause: ` AND (${alias}.ndp LIKE :q OR ${alias}.articulo LIKE :q OR ${alias}.equipo LIKE :q) `,
    params: { q: `%${q}%` }
  };
}
