import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Devuelve la lista de números de gaveta existentes (distinct)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const area = req.user?.area || null;

    const whereClause = area ? 'WHERE LOWER(gavetas.area) = LOWER(?)' : '';
    const params = area ? [area] : [];

    // Return distinct gaveta values as strings. Try to sort numerically when possible
    const [rows] = await pool.query(
      `SELECT DISTINCT gaveta FROM \`gavetas\` ${whereClause} ORDER BY
         (CASE WHEN gaveta REGEXP '^[0-9]+$' THEN CONVERT(gaveta, UNSIGNED) ELSE NULL END) ASC,
         gaveta ASC`,
      params
    );
    res.json(rows.map(r => String(r.gaveta)));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error listando gavetas' });
  }
});

// Devuelve totales por gaveta y total general (precio * cantidad)
router.get('/totales', authenticateToken, async (req, res) => {
  try {
    const area = req.user?.area || null;

    const whereClause = area ? 'WHERE LOWER(gavetas.area) = LOWER(?)' : '';
    const params = area ? [area] : [];

    const [rows] = await pool.query(
      `SELECT gaveta, SUM(COALESCE(precio,0) * COALESCE(cantidad,0)) AS total_gaveta
         FROM \`gavetas\`
         ${whereClause}
        GROUP BY gaveta
        ORDER BY (CASE WHEN gaveta REGEXP '^[0-9]+$' THEN CONVERT(gaveta, UNSIGNED) ELSE NULL END) ASC, gaveta ASC`,
      params
    );

    const [grows] = await pool.query(
      `SELECT SUM(COALESCE(precio,0) * COALESCE(cantidad,0)) AS grand FROM \`gavetas\` ${whereClause}`,
      params
    );
    const grand = grows && grows[0] ? grows[0].grand : 0;

    res.json({ gavetaTotals: rows.map(r => ({ gaveta: String(r.gaveta), total: Number(r.total_gaveta || 0) })), grandTotal: Number(grand || 0) });
  } catch (e) {
    console.error('Error obteniendo totales de gavetas:', e);
    res.status(500).json({ message: 'Error obteniendo totales' });
  }
});

export default router;
