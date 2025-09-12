import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Devuelve la lista de números de gaveta existentes (distinct)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT gaveta FROM `gavetas` ORDER BY gaveta ASC'
    );
    // Devuelve como array plano de números
    res.json(rows.map(r => r.gaveta));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error listando gavetas' });
  }
});

export default router;
