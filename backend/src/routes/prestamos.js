import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import { createCredConnection } from '../utils/credenciales.js';
import { lockItem, applyStockDelta, StockError } from '../services/stock.js';

const router = Router();

// Normalizar entrada de empleado (igual que en auth.js)
function normalizeEmployeeInput(input) {
  let normalized = String(input).trim();
  const match = normalized.match(/^0*(\d+)([A-Za-z])?$/);
  if (match) {
    const number = match[1];
    const letter = match[2] || 'A';
    normalized = `${number}${letter}`;
  } else {
    normalized = normalized.replace(/^0+/, '') + 'A';
  }
  return normalized;
}

// Obtener información de usuario desde credenciales
async function getUserInfo(employeeInput) {
  try {
    const normalized = normalizeEmployeeInput(employeeInput);
    const conn = await createCredConnection();
    const [rows] = await conn.execute(
      'SELECT nombre, num_empleado, usuario, rol, area FROM users WHERE num_empleado = ? OR usuario = ? LIMIT 1',
      [normalized, normalized]
    );
    await conn.end();
    if (!rows || rows.length === 0) return null;
    return rows[0];
  } catch (e) {
    console.error('Error obteniendo info de usuario:', e);
    return null;
  }
}

// Validar autorizador (debe ser Administrador o Ingeniero)
async function validateAuthorizer(num_empleado, password) {
  try {
    const normalized = normalizeEmployeeInput(num_empleado);
    const conn = await createCredConnection();
    const [rows] = await conn.execute(
      'SELECT nombre, num_empleado, pass_hash, rol, area FROM users WHERE num_empleado = ? OR usuario = ? LIMIT 1',
      [normalized, normalized]
    );
    await conn.end();

    if (!rows || rows.length === 0) return { ok: false, message: 'Autorizador no encontrado' };

    const user = rows[0];
    if (!['Administrador', 'Ingeniero'].includes(user.rol)) {
      return { ok: false, message: 'Solo un Administrador o Ingeniero puede autorizar préstamos' };
    }

    const bcrypt = (await import('bcryptjs')).default;
    const hash = Buffer.isBuffer(user.pass_hash) ? user.pass_hash.toString('utf8') : user.pass_hash;
    const valid = await bcrypt.compare(password, hash);
    if (!valid) return { ok: false, message: 'Contraseña del autorizador incorrecta' };

    return { ok: true, user };
  } catch (e) {
    console.error('Error validando autorizador:', e);
    return { ok: false, message: 'Error validando autorizador' };
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

// ─── GET: Listar préstamos activos (filtrados por área del usuario) ───────────
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userArea = req.user?.area || null;
    
    let rows;
    if (userArea) {
      // Estrictamente filtrar por área
      const [result] = await pool.query(
        `SELECT p.* FROM prestamos p WHERE LOWER(p.area) = LOWER(:userArea)`,
        { userArea }
      );
      rows = result;
    } else {
      // Sin área asignada: devolver todos (caso Ingeniero sin área asignada)
      const [result] = await pool.query(`SELECT p.* FROM prestamos p`);
      rows = result;
    }

    res.json(rows);
  } catch (e) {
    console.error('Error listando préstamos:', e);
    // Fallback: si columna area no existe, devolver todos
    if (e.message && e.message.includes('Unknown column')) {
      try {
        const [rows] = await pool.query(`SELECT p.* FROM prestamos p`);
        return res.json(rows);
      } catch (e2) {
        return res.status(500).json({ message: 'Error listando préstamos' });
      }
    }
    res.status(500).json({ message: 'Error listando préstamos' });
  }
});

// ─── POST: Crear préstamo(s) — soporta múltiples ítems en un solo lote ────────
// Body: {
//   employee_input: string,          // num_empleado del que recibe el préstamo
//   items: [{ item_id, cantidad }],  // lista de ítems a prestar
//   authorizer_num_empleado: string, // quien autoriza (Administrador/Ingeniero)
//   authorizer_password: string
// }
router.post('/', authenticateToken, async (req, res) => {
  const {
    employee_input,
    items,
    authorizer_num_empleado,
    authorizer_password
  } = req.body;

  if (!employee_input) {
    return res.status(400).json({ message: 'Se requiere el número de empleado del prestatario' });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Se requiere al menos un artículo para prestar' });
  }
  if (!authorizer_num_empleado || !authorizer_password) {
    return res.status(400).json({ message: 'Se requieren credenciales del autorizador' });
  }

  try {
    // 1. Validar autorizador
    const authResult = await validateAuthorizer(authorizer_num_empleado, authorizer_password);
    if (!authResult.ok) {
      return res.status(401).json({ message: authResult.message });
    }
    const authUser = authResult.user;

    // 2. Obtener info del empleado que recibe el préstamo
    const employeeInfo = await getUserInfo(employee_input);
    if (!employeeInfo) {
      return res.status(404).json({ message: 'Empleado prestatario no encontrado' });
    }

    const results = [];
    const errors = [];

    // 3. Procesar cada ítem
    for (const itemReq of items) {
      const { item_id, cantidad } = itemReq;
      const qty = parseInt(cantidad, 10);

      if (!item_id || !qty || qty < 1) {
        errors.push({ item_id, error: 'ID o cantidad inválidos' });
        continue;
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        // Bloquea el ítem hasta confirmar, para evitar sobre-préstamos en peticiones simultáneas
        const item = await lockItem(conn, item_id);

        if (!item) {
          await conn.rollback();
          errors.push({ item_id, error: 'Artículo no encontrado' });
          continue;
        }

        if (item.cantidad < qty) {
          await conn.rollback();
          errors.push({ item_id, articulo: item.articulo, error: `No hay suficientes unidades (disponibles: ${item.cantidad})` });
          continue;
        }

        const itemArea = req.user?.area || item.area || null;
        const actor = authUser.nombre || authUser.num_empleado;

        // Crear registro de préstamo (con gaveta_id para poder devolver el ítem exacto)
        const [insertResult] = await conn.query(
          `INSERT INTO prestamos (empleado, num_empleado, articulo, ndp, gaveta, gaveta_id, cantidad, empleado1, area)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            employeeInfo.nombre,
            employeeInfo.num_empleado,
            item.articulo,
            item.ndp || null,
            item.gaveta || null,
            item.id,
            qty,
            actor,
            itemArea
          ]
        );

        // Descontar inventario y registrar el movimiento en la misma transacción
        const { antes: prevQty, despues: newQty } = await applyStockDelta(conn, item.id, {
          delta: -qty,
          tipo: 'PRESTAMO',
          actor,
          referenciaId: insertResult.insertId,
          allowNegative: false
        });

        await conn.commit();

        // Log
        await logCambio(
          actor,
          'PRESTAMO',
          {
            empleado: employeeInfo.nombre,
            num_empleado: employeeInfo.num_empleado,
            articulo: item.articulo,
            ndp: item.ndp,
            cantidad_prestada: qty,
            cantidad_anterior: prevQty,
            cantidad_nueva: newQty,
            autorizado_por: authUser.nombre
          },
          'N/A',
          item,
          itemArea
        );

        results.push({
          item_id: item.id,
          articulo: item.articulo,
          cantidad_prestada: qty,
          cantidad_restante: newQty
        });
      } catch (itemErr) {
        await conn.rollback();
        if (itemErr instanceof StockError) {
          errors.push({ item_id, error: itemErr.message });
        } else {
          console.error(`Error procesando ítem ${item_id}:`, itemErr);
          errors.push({ item_id, error: 'Error interno al procesar ítem' });
        }
      } finally {
        conn.release();
      }
    }

    if (results.length === 0) {
      return res.status(400).json({
        message: 'No se procesó ningún préstamo',
        errors
      });
    }

    res.status(201).json({
      message: `Préstamo registrado: ${results.length} artículo(s) prestado(s) a ${employeeInfo.nombre}`,
      empleado: employeeInfo.nombre,
      num_empleado: employeeInfo.num_empleado,
      autorizado_por: authUser.nombre,
      items: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (e) {
    console.error('Error creando préstamo:', e);
    res.status(500).json({ message: 'Error registrando préstamo' });
  }
});

// ─── POST: Devolver préstamo ──────────────────────────────────────────────────
router.post('/:num_empleado/devolver', authenticateToken, async (req, res) => {
  const { num_empleado } = req.params;
  const { id, articulo, cantidad = 1 } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Buscar préstamo (bloqueado para la transacción)
    let prestamo;
    if (id) {
      const [rows] = await conn.query(
        `SELECT * FROM prestamos WHERE id = ? LIMIT 1 FOR UPDATE`,
        [id]
      );
      if (!rows || rows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ message: 'No se encontró préstamo con ese id' });
      }
      prestamo = rows[0];
    } else {
      const [rows] = await conn.query(
        `SELECT * FROM prestamos WHERE num_empleado = ? AND articulo = ? LIMIT 1 FOR UPDATE`,
        [num_empleado, articulo]
      );
      if (!rows || rows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ message: 'No se encontró préstamo activo para este empleado y artículo' });
      }
      prestamo = rows[0];
    }

    // 2. Buscar artículo: por gaveta_id cuando existe; por nombre solo para préstamos anteriores a la migración
    let item;
    if (prestamo.gaveta_id) {
      item = await lockItem(conn, prestamo.gaveta_id);
    } else {
      const [itemRows] = await conn.query(
        `SELECT * FROM gavetas WHERE articulo = ? LIMIT 1 FOR UPDATE`,
        [prestamo.articulo]
      );
      item = itemRows[0] || null;
    }
    if (!item) {
      await conn.rollback();
      return res.status(404).json({ message: 'Artículo asociado al préstamo no encontrado' });
    }

    // 3. Validar cantidad
    const qty = parseInt(cantidad, 10);
    if (!qty || qty < 1) {
      await conn.rollback();
      return res.status(400).json({ message: 'Cantidad inválida' });
    }
    if (qty > prestamo.cantidad) {
      await conn.rollback();
      return res.status(400).json({ message: 'No puedes devolver más de lo prestado' });
    }

    const actor = prestamo.empleado || prestamo.num_empleado;

    // 4. Sumar cantidad al inventario y registrar el movimiento
    const { antes: prevQty, despues: newQty } = await applyStockDelta(conn, item.id, {
      delta: qty,
      tipo: 'DEVOLUCION',
      actor,
      referenciaId: prestamo.id,
      allowNegative: false
    });

    // 5. Actualizar/eliminar préstamo
    if (qty === prestamo.cantidad) {
      await conn.query(`DELETE FROM prestamos WHERE id = ?`, [prestamo.id]);
    } else {
      await conn.query(
        `UPDATE prestamos SET cantidad = cantidad - ? WHERE id = ?`,
        [qty, prestamo.id]
      );
    }

    await conn.commit();

    // 6. Log
    await logCambio(
      actor,
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
    await conn.rollback();
    if (e instanceof StockError) return res.status(e.status).json({ message: e.message });
    console.error('Error devolviendo artículo:', e);
    res.status(500).json({ message: 'Error devolviendo artículo' });
  } finally {
    conn.release();
  }
});

export default router;
