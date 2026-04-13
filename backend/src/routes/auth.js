import { Router } from 'express';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';
dotenv.config();

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

// Normalizar entrada de empleado
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

// Login con employee_input y password
router.post(
  '/login',
  body('employee_input').isString().notEmpty(),
  body('password').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { employee_input, password } = req.body;

    try {
      const normalized = normalizeEmployeeInput(employee_input);
      const conn = await createCredConnection();
      
      const [rows] = await conn.execute(
        'SELECT id, nombre, usuario, num_empleado, pass_hash, rol, area FROM users WHERE num_empleado = ? OR usuario = ? LIMIT 1',
        [normalized, normalized]
      );
      await conn.end();

      if (!rows || rows.length === 0) {
        return res.status(401).json({ message: 'Usuario no encontrado' });
      }

      const user = rows[0];
      const bcrypt = (await import('bcryptjs')).default;
      const hash = Buffer.isBuffer(user.pass_hash) ? user.pass_hash.toString('utf8') : user.pass_hash;
      const ok = await bcrypt.compare(password, hash);
      if (!ok) return res.status(401).json({ message: 'Contraseña incorrecta' });

      const token = jwt.sign(
        { 
          username: user.num_empleado, 
          rol: user.rol,
          nombre: user.nombre,
          area: user.area || null
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );

      res.json({ 
        token, 
        user: { 
          username: user.num_empleado, 
          rol: user.rol,
          nombre: user.nombre,
          area: user.area || null
        } 
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Error de servidor' });
    }
  }
);

// Lookup user sin password (para escaneo)
router.get('/lookup/:employee_input', async (req, res) => {
  try {
    const { employee_input } = req.params;
    if (!employee_input) return res.status(400).json({ error: 'employee_input es requerido' });

    const normalized = normalizeEmployeeInput(employee_input);
    const conn = await createCredConnection();
    
    const [rows] = await conn.execute(
      'SELECT id, nombre, usuario, num_empleado, rol, area FROM users WHERE num_empleado = ? OR usuario = ? LIMIT 1',
      [normalized, normalized]
    );
    await conn.end();

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = rows[0];
    res.json({ 
      success: true, 
      nombre: user.nombre, 
      usuario: user.usuario, 
      num_empleado: user.num_empleado,
      rol: user.rol,
      area: user.area || null
    });
  } catch (err) {
    console.error('Error buscando usuario:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Change password - only employee 258 can change passwords
router.post('/change-password', async (req, res) => {
  const { currentPassword, newPassword, current } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const username = decoded.username;

    // Only employee 258 or 258A can change passwords
    const allowedEmps = ['258', '258A'];
    const isAllowed = allowedEmps.some(emp => 
      username === emp || username === emp.toLowerCase() || username.toUpperCase() === emp
    );
    
    if (!isAllowed) {
      return res.status(403).json({ message: 'Solo el empleado 258 puede cambiar contraseñas' });
    }

    // Validate current password
    const conn = await createCredConnection();
    const [rows] = await conn.execute(
      'SELECT pass_hash FROM users WHERE num_empleado = ? OR usuario = ? LIMIT 1',
      [username, username]
    );
    await conn.end();

    if (!rows || rows.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const bcrypt = (await import('bcryptjs')).default;
    const pwd = currentPassword || current;
    const hash = Buffer.isBuffer(rows[0].pass_hash) ? rows[0].pass_hash.toString('utf8') : rows[0].pass_hash;
    const ok = await bcrypt.compare(pwd, hash);

    if (!ok) {
      return res.status(400).json({ message: 'Contraseña actual incorrecta' });
    }

    // Update password
    const newHash = await bcrypt.hash(newPassword, 10);
    const connUpdate = await createCredConnection();
    await connUpdate.execute(
      'UPDATE users SET pass_hash = ? WHERE num_empleado = ? OR usuario = ?',
      [newHash, username, username]
    );
    await connUpdate.end();

    res.json({ message: 'Contraseña cambiada correctamente' });
  } catch (e) {
    console.error(e);
    if (e.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido' });
    }
    res.status(500).json({ message: 'Error cambiando contraseña' });
  }
});

// Validate credentials for authorizing prestamos (Administrador or Ingeniero only)
router.post('/validate', async (req, res) => {
  const { num_empleado, password } = req.body;
  if (!num_empleado || !password) {
    return res.status(400).json({ message: 'Se requiere num_empleado y contraseña' });
  }
  try {
    const normalized = normalizeEmployeeInput(num_empleado);
    const conn = await createCredConnection();
    const [rows] = await conn.execute(
      'SELECT nombre, num_empleado, rol, area FROM users WHERE num_empleado = ? OR usuario = ? LIMIT 1',
      [normalized, normalized]
    );
    await conn.end();

    if (!rows || rows.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const user = rows[0];
    // Only Administrador or Ingeniero can authorize prestamos
    if (!['Administrador', 'Ingeniero'].includes(user.rol)) {
      return res.status(403).json({ message: 'Solo un Administrador o Ingeniero puede autorizar préstamos' });
    }

    // Validate password
    const conn2 = await createCredConnection();
    const [hashRows] = await conn2.execute(
      'SELECT pass_hash FROM users WHERE num_empleado = ? OR usuario = ? LIMIT 1',
      [normalized, normalized]
    );
    await conn2.end();

    if (!hashRows || hashRows.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const bcrypt = (await import('bcryptjs')).default;
    const hash = Buffer.isBuffer(hashRows[0].pass_hash) ? hashRows[0].pass_hash.toString('utf8') : hashRows[0].pass_hash;
    const ok = await bcrypt.compare(password, hash);
    if (!ok) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    res.json({
      valid: true,
      nombre: user.nombre,
      num_empleado: user.num_empleado,
      rol: user.rol,
      area: user.area || null
    });
  } catch (e) {
    console.error('Error validando autorizador:', e);
    res.status(500).json({ message: 'Error de servidor' });
  }
});

export default router;
