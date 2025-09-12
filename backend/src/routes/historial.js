import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = Router();

// Obtener historial global de cambios (solo admin)
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, accion, adetalle, detalle, fecha_hora, turno FROM cambios ORDER BY fecha_hora DESC LIMIT 500'
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error obteniendo historial' });
  }
});

export default router;
