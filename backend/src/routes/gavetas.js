import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Devuelve la lista de números de gaveta existentes (distinct)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Return distinct gaveta values as strings. Try to sort numerically when possible
    const [rows] = await pool.query(
      `SELECT DISTINCT gaveta FROM \`gavetas\` ORDER BY
         (CASE WHEN gaveta REGEXP '^[0-9]+$' THEN CONVERT(gaveta, UNSIGNED) ELSE NULL END) ASC,
         gaveta ASC`);
    res.json(rows.map(r => String(r.gaveta)));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error listando gavetas' });
  }
});

export default router;
