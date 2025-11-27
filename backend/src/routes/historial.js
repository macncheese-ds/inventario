import { Router } from 'express';
import pool from '../db.js';
import mysql from 'mysql2/promise';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = Router();

// Helper para conectar a credenciales DB
async function createCredConnection() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.CRED_DB_NAME || 'credenciales'
  };
  return await mysql.createConnection(config);
}

// Obtener historial global de cambios (solo admin)
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const userArea = req.user?.area ? String(req.user.area).toLowerCase() : null;

    let query = 'SELECT id, username, accion, adetalle, detalle, fecha_hora, turno, area FROM cambios';
    const params = [];

    // Si el usuario tiene un área definida (ensamble, smt, etc.),
    // solo mostrar cambios de esa misma área.
    if (userArea) {
      query += ' WHERE LOWER(area) = ?';
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
