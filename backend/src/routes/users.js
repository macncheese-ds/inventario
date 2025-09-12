import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import { body } from 'express-validator';

const router = Router();

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
// Calcular turno según reglas
function calcularTurno() {
  const now = new Date();
  const dia = now.getDay(); // 0=domingo, 1=lunes, ...
  const hora = now.getHours();
  if ((dia >= 1 && dia <= 4) && (hora >= 8 && hora < 20)) return 'Primero';
  if (((dia === 3 || dia === 4 || dia === 5 || dia === 6) && (hora >= 20 || hora < 8))) return 'Segundo';
  if (((dia === 1 || dia === 2) && (hora >= 20 || hora < 8)) || ((dia === 5 || dia === 6) && (hora >= 8 && hora < 20))) return 'Mixto';
  return 'N/A';
}

// Cambio de contraseña usuario activo
router.post('/change-password', authenticateToken, [
  body('current').isString().notEmpty(),
  body('newPassword').isString().isLength({ min: 4 })
], async (req, res) => {
  const { current, newPassword } = req.body;
  const username = req.user.username;
  try {
    const [rows] = await pool.query('SELECT username, pass_hash, rol, nombre FROM users WHERE username=:u', { u: username });
    if (!rows.length) return res.status(404).json({ message: 'Usuario no encontrado' });
    const user = rows[0];
    const bcrypt = (await import('bcryptjs')).default;
    const hash = Buffer.isBuffer(user.pass_hash) ? user.pass_hash.toString() : user.pass_hash;
    const ok = await bcrypt.compare(current, hash);
    if (!ok) return res.status(400).json({ message: 'Contraseña actual incorrecta' });
    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET pass_hash=:p WHERE username=:u', { p: newHash, u: username });
    // Log detalle anterior y nuevo
    const adetalle = { ...user };
    delete adetalle.pass_hash;
    const detalle = { ...user };
    detalle.pass_hash = '***';
    await logCambio(username, 'USER_UPDATE', detalle, calcularTurno(), adetalle);
    res.json({ message: 'Contraseña cambiada correctamente' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error cambiando contraseña' });
  }
});

// Listar usuarios (solo admin)
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT username, rol, nombre FROM users ORDER BY username ASC'
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error listando usuarios' });
  }
});

// Crear usuario (solo admin)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { username, password, rol = 'operador', nombre, adminPassword } = req.body;
  try {
    // Permitir crear el primer usuario admin si no hay usuarios
    const [allUsers] = await pool.query('SELECT COUNT(*) as total FROM users');
    if (allUsers[0].total === 0) {
      const bcrypt = (await import('bcryptjs')).default;
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        'INSERT INTO users (username, pass_hash, rol, nombre) VALUES (:u, :p, :r, :n)',
        { u: username, p: hash, r: rol, n: nombre }
      );
      await logCambio(username, 'USER_ADD', { username, rol, nombre });
      return res.status(201).json({ username, rol, nombre });
    }
    if (!adminPassword) return res.status(400).json({ message: 'Debes ingresar la contraseña de administrador' });
    // Validar contraseña del admin actual
    const [userRows] = await pool.query('SELECT pass_hash FROM users WHERE username=:u', { u: req.user.username });
    if (!userRows.length) return res.status(401).json({ message: 'Usuario no encontrado' });
    const bcrypt = (await import('bcryptjs')).default;
    const hashAdmin = Buffer.isBuffer(userRows[0].pass_hash) ? userRows[0].pass_hash.toString() : userRows[0].pass_hash;
    const ok = await bcrypt.compare(adminPassword, hashAdmin);
    if (!ok) return res.status(401).json({ message: 'Contraseña de administrador incorrecta' });

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, pass_hash, rol, nombre) VALUES (:u, :p, :r, :n)',
      { u: username, p: hash, r: rol, n: nombre }
    );
    await logCambio(req.user.username, 'USER_ADD', { username, rol, nombre });
    res.status(201).json({ username, rol, nombre });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error creando usuario' });
  }
});

// Actualizar usuario (solo admin)
router.put('/:username', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { username } = req.params;
  const { password, rol, nombre, adminPassword } = req.body;
  try {
    // Validar contraseña del admin actual
    const [userRows] = await pool.query('SELECT pass_hash FROM users WHERE username=:u', { u: req.user.username });
    if (!userRows.length) return res.status(401).json({ message: 'Usuario no encontrado' });
    const bcrypt = (await import('bcryptjs')).default;
    const hashAdmin = Buffer.isBuffer(userRows[0].pass_hash) ? userRows[0].pass_hash.toString() : userRows[0].pass_hash;
    const ok = await bcrypt.compare(adminPassword, hashAdmin);
    if (!ok) return res.status(401).json({ message: 'Contraseña de administrador incorrecta' });

    const sets = [];
    const params = { u: username };

    if (typeof nombre === 'string') { sets.push('nombre=:n'); params.n = nombre; }
    if (rol) { sets.push('rol=:r'); params.r = rol; }
    if (password) {
      params.p = await bcrypt.hash(password, 10);
      sets.push('pass_hash=:p');
    }
    if (!sets.length) return res.json({ message: 'Sin cambios' });

  // Obtener detalle anterior
  const [prev] = await pool.query('SELECT username, rol, nombre FROM users WHERE username=:u', { u: username });
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE username=:u`, params);
  const [rows] = await pool.query('SELECT username, rol, nombre FROM users WHERE username=:u', { u: username });
  await logCambio(req.user.username, 'USER_UPDATE', rows[0], calcularTurno(), prev[0] || null);
  res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error actualizando usuario' });
  }
});

// Eliminar usuario (solo admin)
router.delete('/:username', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { username } = req.params;
  const { adminPassword } = req.body;
  try {
    // Validar contraseña del admin actual
    const [userRows] = await pool.query('SELECT pass_hash FROM users WHERE username=:u', { u: req.user.username });
    if (!userRows.length) return res.status(401).json({ message: 'Usuario no encontrado' });
    const bcrypt = (await import('bcryptjs')).default;
    const hashAdmin = Buffer.isBuffer(userRows[0].pass_hash) ? userRows[0].pass_hash.toString() : userRows[0].pass_hash;
    const ok = await bcrypt.compare(adminPassword, hashAdmin);
    if (!ok) return res.status(401).json({ message: 'Contraseña de administrador incorrecta' });

  const [prev] = await pool.query('SELECT username, rol, nombre FROM users WHERE username=:u', { u: username });
  await pool.query('DELETE FROM users WHERE username=:u', { u: username });
  await logCambio(req.user.username, 'USER_DELETE', { username }, calcularTurno(), prev[0] || null);
  res.json({ message: 'Usuario eliminado' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error eliminando usuario' });
  }
});

// Ruta pública para registrar un nuevo usuario, validando con credenciales de un admin existente
router.post('/register', async (req, res) => {
  const { username, password, rol = 'operador', nombre, adminUsername, adminPassword } = req.body;

  try {
    // Si no hay usuarios, el primero se puede crear sin validación de admin.
    const [allUsers] = await pool.query('SELECT COUNT(*) as total FROM users');
    if (allUsers[0].total > 0) {
      if (!adminUsername || !adminPassword) {
        return res.status(400).json({ message: 'Debes proporcionar el usuario y la contraseña de un administrador para registrar un nuevo usuario.' });
      }

      // Validar las credenciales del administrador proporcionado
      const [adminRows] = await pool.query('SELECT pass_hash, rol FROM users WHERE username=:u', { u: adminUsername });
      if (!adminRows.length || adminRows[0].rol !== 'admin') {
        return res.status(401).json({ message: 'El usuario administrador no es válido o no tiene permisos.' });
      }

      const bcrypt = (await import('bcryptjs')).default;
      const adminHash = Buffer.isBuffer(adminRows[0].pass_hash) ? adminRows[0].pass_hash.toString() : adminRows[0].pass_hash;
      const isAdminPasswordOk = await bcrypt.compare(adminPassword, adminHash);

      if (!isAdminPasswordOk) {
        return res.status(401).json({ message: 'La contraseña del administrador es incorrecta.' });
      }
    }

    // Crear el nuevo usuario
    const bcrypt = (await import('bcryptjs')).default;
    const newUserHash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, pass_hash, rol, nombre) VALUES (:u, :p, :r, :n)',
      { u: username, p: newUserHash, r: rol, n: nombre }
    );

    // Registrar el cambio
    const logUsername = allUsers[0].total > 0 ? adminUsername : username;
    await logCambio(logUsername, 'USER_ADD', { username, rol, nombre });

    res.status(201).json({ username, rol, nombre });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
    }
    console.error('Error en /register:', e);
    res.status(500).json({ message: 'Error creando el usuario.' });
  }
});

export default router;
