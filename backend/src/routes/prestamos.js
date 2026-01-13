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
async function logCambio(username, accion, detalle, turno = 'N/A', adetalle = null, area = null) {
  try {
    await pool.query(
      `INSERT INTO cambios (username, accion, detalle, fecha_hora, turno, adetalle, area)
       VALUES (:u, :a, :d, NOW(), :t, :ad, :area)`,
      { 
        u: username, 
        a: accion, 
        d: typeof detalle === 'string' ? detalle : JSON.stringify(detalle), 
        t: turno, 
        ad: adetalle ? (typeof adetalle === 'string' ? adetalle : JSON.stringify(adetalle)) : null,
        area: area
      }
    );
  } catch (e) {
    console.error('Log cambio fallo:', e.message);
  }
}

// Listar préstamos activos (filtrados por área del usuario)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userArea = req.user?.area || null;
    const params = {};
    let whereClause = '';
    
    // Filtrar por área: solo mostrar préstamos de items del área del usuario
    if (userArea) {
      whereClause = ` WHERE (LOWER(p.area) = LOWER(:userArea) OR p.area IS NULL)`;
      params.userArea = userArea;
    }
    
    try {
      const [rows] = await pool.query(
        `SELECT p.* FROM prestamos p ${whereClause}`,
        params
      );
      res.json(rows);
    } catch (err) {
      // Si falla porque la columna area no existe, hacer la query sin filtro
      if (err.message.includes('Unknown column')) {
        console.warn('Columna area no existe en tabla prestamos, devolviendo todos los préstamos');
        const [rows] = await pool.query(
          `SELECT p.* FROM prestamos p`
        );
        res.json(rows);
      } else {
        throw err;
      }
    }
  } catch (e) {
    console.error('Error listando préstamos:', e);
    res.status(500).json({ message: 'Error listando préstamos' });
  }
});

// Crear préstamo (prestar artículo)
// Nuevo flujo: solo requiere gafete y cantidad, sin admin ni contraseña
router.post('/', authenticateToken, async (req, res) => {
  const {
    employee_input, // gafete del empleado
    articulo,       // nombre del artículo
    cantidad = 1,   // cantidad a prestar
    item_id         // id del artículo (opcional, preferido)
  } = req.body;

  try {
    // 1. Obtener info del empleado
    const employeeInfo = await getUserInfo(employee_input);
    if (!employeeInfo) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    // 2. Obtener info del artículo
    let item;
    if (item_id) {
      const [itemRows] = await pool.query(
        `SELECT * FROM gavetas WHERE id = :id`,
        { id: item_id }
      );
      if (!itemRows || itemRows.length === 0) {
        return res.status(404).json({ message: 'Artículo no encontrado' });
      }
      item = itemRows[0];
    } else if (articulo) {
      const [itemRows] = await pool.query(
        `SELECT * FROM gavetas WHERE articulo = :articulo LIMIT 1`,
        { articulo }
      );
      if (!itemRows || itemRows.length === 0) {
        return res.status(404).json({ message: 'Artículo no encontrado' });
      }
      item = itemRows[0];
    } else {
      return res.status(400).json({ message: 'Falta el artículo a prestar' });
    }

    // 3. Validar cantidad
    const qty = parseInt(cantidad, 10);
    if (!qty || qty < 1) {
      return res.status(400).json({ message: 'Cantidad inválida' });
    }
    if (item.cantidad < qty) {
      return res.status(400).json({ message: 'No hay suficientes unidades disponibles para prestar' });
    }

    // 4. Crear registro de préstamo (una fila por préstamo, con cantidad y área)
    const itemArea = req.user?.area || item.area || null;
    await pool.query(
      `INSERT INTO prestamos (empleado, num_empleado, articulo, cantidad, area)
       VALUES (:empleado, :num_empleado, :articulo, :cantidad, :area)`,
      {
        empleado: employeeInfo.nombre,
        num_empleado: employeeInfo.num_empleado,
        articulo: item.articulo,
        cantidad: qty,
        area: itemArea
      }
    );

    // 5. Decrementar cantidad del artículo
    const prevQty = item.cantidad;
    const newQty = prevQty - qty;
    await pool.query(
      `UPDATE gavetas SET cantidad = :newQty WHERE id = :id`,
      { newQty, id: item.id }
    );

    // 6. Log del cambio
    await logCambio(
      employeeInfo.nombre || employeeInfo.num_empleado,
      'PRESTAMO',
      {
        empleado: employeeInfo.nombre,
        num_empleado: employeeInfo.num_empleado,
        articulo: item.articulo,
        ndp: item.ndp,
        cantidad_prestada: qty,
        cantidad_anterior: prevQty,
        cantidad_nueva: newQty
      },
      'N/A',
      item,
      req.user?.area || item.area
    );

    res.status(201).json({
      message: 'Préstamo registrado exitosamente',
      empleado: employeeInfo.nombre,
      articulo: item.articulo,
      cantidad_prestada: qty,
      cantidad_restante: newQty
    });
  } catch (e) {
    console.error('Error creando préstamo:', e);
    res.status(500).json({ message: 'Error registrando préstamo' });
  }
});

// Devolver préstamo
// Nuevo flujo: devolución sin admin, acepta cantidad
router.post('/:num_empleado/devolver', authenticateToken, async (req, res) => {
  const { num_empleado } = req.params;
  const { id, articulo, cantidad = 1 } = req.body;

  try {
    // 1. Buscar préstamo activo por id si está presente, si no por combinación
    let prestamo;
    if (id) {
      const [rows] = await pool.query(
        `SELECT * FROM prestamos WHERE id = :id LIMIT 1`,
        { id }
      );
      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: 'No se encontró préstamo con ese id' });
      }
      prestamo = rows[0];
    } else {
      const [rows] = await pool.query(
        `SELECT * FROM prestamos WHERE num_empleado = :num_empleado AND articulo = :articulo LIMIT 1`,
        { num_empleado, articulo }
      );
      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: 'No se encontró préstamo activo para este empleado y artículo' });
      }
      prestamo = rows[0];
    }

    // 2. Buscar el artículo
    const [itemRows] = await pool.query(
      `SELECT * FROM gavetas WHERE articulo = :articulo LIMIT 1`,
      { articulo }
    );
    if (!itemRows || itemRows.length === 0) {
      return res.status(404).json({ message: 'Artículo asociado al préstamo no encontrado' });
    }
    const item = itemRows[0];

    // 3. Validar cantidad
    const qty = parseInt(cantidad, 10);
    if (!qty || qty < 1) {
      return res.status(400).json({ message: 'Cantidad inválida' });
    }
    if (qty > prestamo.cantidad) {
      return res.status(400).json({ message: 'No puedes devolver más de lo prestado' });
    }

    // 4. Sumar cantidad al inventario
    const prevQty = item.cantidad || 0;
    const newQty = prevQty + qty;
    await pool.query(
      `UPDATE gavetas SET cantidad = :newQty WHERE id = :id`,
      { newQty, id: item.id }
    );

    // 5. Actualizar/eliminar préstamo usando id
    if (qty === prestamo.cantidad) {
      // Devolver todo: eliminar préstamo por id
      await pool.query(
        `DELETE FROM prestamos WHERE id = :id`,
        { id: prestamo.id }
      );
    } else {
      // Devolver parcial: restar cantidad por id
      await pool.query(
        `UPDATE prestamos SET cantidad = cantidad - :qty WHERE id = :id`,
        { qty, id: prestamo.id }
      );
    }

    // 6. Log del cambio
    await logCambio(
      prestamo.empleado || prestamo.num_empleado,
      'DEVOLUCION',
      {
        empleado: prestamo.empleado,
        num_empleado: prestamo.num_empleado,
        articulo: prestamo.articulo,
        ndp: item.ndp,
        cantidad_devuelta: qty,
        cantidad_anterior: prevQty,
        cantidad_nueva: newQty
      },
      'N/A',
      prestamo,
      req.user?.area || item.area
    );

    res.json({
      message: 'Artículo devuelto exitosamente',
      articulo: prestamo.articulo,
      cantidad_devuelta: qty,
      cantidad_actual: newQty
    });
  } catch (e) {
    console.error('Error devolviendo artículo:', e);
    res.status(500).json({ message: 'Error devolviendo artículo' });
  }
});

export default router;
