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

// Validar contraseña desde credenciales
async function validatePassword(username, password) {
  try {
    const conn = await createCredConnection();
    const [rows] = await conn.execute(
      'SELECT pass_hash FROM users WHERE num_empleado = ? OR usuario = ? LIMIT 1',
      [username, username]
    );
    await conn.end();

    if (!rows || rows.length === 0) return false;

    const bcrypt = (await import('bcryptjs')).default;
    const hash = Buffer.isBuffer(rows[0].pass_hash) ? rows[0].pass_hash.toString() : rows[0].pass_hash;
    return await bcrypt.compare(password, hash);
  } catch (e) {
    console.error('Error validando contraseña:', e);
    return false;
  }
}

// Obtener información de usuario desde credenciales
async function getUserInfo(employeeInput) {
  try {
    const conn = await createCredConnection();
    const [rows] = await conn.execute(
      'SELECT nombre, num_empleado, usuario FROM users WHERE num_empleado = ? OR usuario = ? LIMIT 1',
      [employeeInput, employeeInput]
    );
    await conn.end();

    if (!rows || rows.length === 0) return null;
    return rows[0];
  } catch (e) {
    console.error('Error obteniendo info de usuario:', e);
    return null;
  }
}

// Helper para auditoría
async function logCambio(username, accion, detalle, turno = 'N/A', adetalle = null) {
  try {
    await pool.query(
      `INSERT INTO cambios (username, accion, detalle, fecha_hora, turno, adetalle)
       VALUES (:u, :a, :d, NOW(), :t, :ad)`,
      { u: username, a: accion, d: typeof detalle === 'string' ? detalle : JSON.stringify(detalle), t: turno, ad: adetalle ? (typeof adetalle === 'string' ? adetalle : JSON.stringify(adetalle)) : null }
    );
  } catch (e) {
    console.error('Log cambio fallo:', e.message);
  }
}

// Listar préstamos activos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM prestamos`
    );
    res.json(rows);
  } catch (e) {
    console.error('Error listando préstamos:', e);
    res.status(500).json({ message: 'Error listando préstamos' });
  }
});

// Crear préstamo (prestar artículo)
router.post('/', authenticateToken, authorizeRoles('admin', 'operador'), async (req, res) => {
  const { 
    employee_input,      // gafete del empleado que pide prestado
    admin_employee_input, // gafete del admin/operador
    admin_password,      // contraseña del admin/operador
    item_id,             // ID del artículo a prestar
    turno 
  } = req.body;

  try {
    // 1. Validar contraseña del admin/operador
    const passOk = await validatePassword(admin_employee_input, admin_password);
    if (!passOk) {
      return res.status(401).json({ message: 'Contraseña incorrecta del administrador/operador' });
    }

    // 2. Obtener info del empleado que pide prestado
    const employeeInfo = await getUserInfo(employee_input);
    if (!employeeInfo) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    // 3. Obtener info del admin/operador
    const adminInfo = await getUserInfo(admin_employee_input);
    if (!adminInfo) {
      return res.status(404).json({ message: 'Administrador/Operador no encontrado' });
    }

    // 4. Obtener info del artículo
    const [itemRows] = await pool.query(
      `SELECT * FROM gavetas WHERE id = :id`,
      { id: item_id }
    );
    
    if (!itemRows || itemRows.length === 0) {
      return res.status(404).json({ message: 'Artículo no encontrado' });
    }

    const item = itemRows[0];

    // 5. Verificar que hay cantidad disponible
    if (item.cantidad <= 0) {
      return res.status(400).json({ message: 'No hay unidades disponibles para prestar' });
    }

    // 6. Crear registro de préstamo
    await pool.query(
      `INSERT INTO prestamos (empleado, num_empleado, articulo, empleado1, num_empleado1)
       VALUES (:empleado, :num_empleado, :articulo, :empleado1, :num_empleado1)`,
      {
        empleado: employeeInfo.nombre,
        num_empleado: employeeInfo.num_empleado,
        articulo: item.articulo,
        empleado1: adminInfo.nombre,
        num_empleado1: adminInfo.num_empleado
      }
    );

    // 7. Decrementar cantidad del artículo
    const prevQty = item.cantidad;
    const newQty = prevQty - 1;
    await pool.query(
      `UPDATE gavetas SET cantidad = :newQty WHERE id = :id`,
      { newQty, id: item_id }
    );

    // 8. Log del cambio
    await logCambio(
      adminInfo.nombre || adminInfo.num_empleado,
      'PRESTAMO',
      {
        empleado: employeeInfo.nombre,
        num_empleado: employeeInfo.num_empleado,
        articulo: item.articulo,
        ndp: item.ndp,
        cantidad_anterior: prevQty,
        cantidad_nueva: newQty
      },
      turno || 'N/A',
      item
    );

    res.status(201).json({ 
      message: 'Préstamo registrado exitosamente',
      empleado: employeeInfo.nombre,
      articulo: item.articulo,
      cantidad_restante: newQty
    });
  } catch (e) {
    console.error('Error creando préstamo:', e);
    res.status(500).json({ message: 'Error registrando préstamo' });
  }
});

// Devolver préstamo
router.post('/:num_empleado/devolver', authenticateToken, authorizeRoles('admin', 'operador'), async (req, res) => {
  const { num_empleado } = req.params;
  const { admin_employee_input, admin_password } = req.body;

  try {
    // 1. Validar contraseña del admin/operador
    const passOk = await validatePassword(admin_employee_input, admin_password);
    if (!passOk) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // 2. Obtener info del admin/operador
    const adminInfo = await getUserInfo(admin_employee_input);
    if (!adminInfo) {
      return res.status(404).json({ message: 'Administrador/Operador no encontrado' });
    }

    // 3. Obtener y eliminar préstamo
    const [prestamoRows] = await pool.query(
      `DELETE FROM prestamos WHERE num_empleado = :num_empleado`,
      { num_empleado }
    );

    if (prestamoRows.affectedRows === 0) {
      return res.status(404).json({ message: 'No se encontraron préstamos activos para este empleado' });
    }

    if (!itemRows || itemRows.length === 0) {
      return res.status(404).json({ message: 'Artículo no encontrado' });
    }

    const item = itemRows[0];

    // 5. Incrementar cantidad del artículo
    const prevQty = item.cantidad;
    const newQty = prevQty + 1;
    await pool.query(
      `UPDATE gavetas SET cantidad = :newQty WHERE id = :id`,
      { newQty, id: item.id }
    );

    // 6. Eliminar registro de préstamo
    await pool.query(
      `DELETE FROM prestamos WHERE id = :id`,
      { id }
    );

    // 7. Log del cambio
    await logCambio(
      adminInfo.nombre || adminInfo.num_empleado,
      'DEVOLUCION',
      {
        empleado: prestamo.empleado,
        num_empleado: prestamo.num_empleado,
        articulo: prestamo.articulo,
        ndp: item.ndp,
        cantidad_anterior: prevQty,
        cantidad_nueva: newQty,
        recibido_por: adminInfo.nombre
      },
      turno || 'N/A',
      prestamo
    );

    res.json({ 
      message: 'Artículo devuelto exitosamente',
      articulo: prestamo.articulo,
      cantidad_actual: newQty
    });
  } catch (e) {
    console.error('Error devolviendo préstamo:', e);
    res.status(500).json({ message: 'Error al devolver préstamo' });
  }
});

export default router;
