import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import { createCredConnection } from '../utils/credenciales.js';

const router = Router();

// Obtener historial global de cambios (solo admin)
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const userArea = req.user?.area ? String(req.user.area).toLowerCase() : null;

    let query = 'SELECT id, username, accion, adetalle, detalle, fecha_hora, turno, area FROM cambios';
    const params = [];

    // Si el usuario tiene un área definida (ensamble, smt, etc.),
    // solo mostrar cambios de esa misma área, pero también mostrar cambios sin área (compatibilidad con datos antiguos)
    if (userArea) {
      query += ' WHERE (LOWER(area) = ? OR area IS NULL OR area = "")';
      params.push(userArea);
    }

    query += ' ORDER BY fecha_hora DESC LIMIT 500';

    const [cambios] = await pool.query(query, params);
    
    // El campo username ahora contiene el nombre de la persona
    // Mantener compatibilidad con registros antiguos que tengan num_empleado
    const enrichedCambios = cambios.map(c => ({
      ...c,
      user_nombre: c.username, // username ahora es el nombre
      user_rol: null // No necesitamos el rol en el historial
    }));
    
    res.json(enrichedCambios);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error obteniendo historial' });
  }
});

export default router;
