import { Router } from 'express';
import mysql from 'mysql2/promise';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = Router();

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

router.post('/change-password', authenticateToken, async (req, res) => {
  const { current, newPassword, currentPassword } = req.body;
  const username = req.user.username;
  
  // Only employee 258 or 258A can change passwords
  const allowedEmps = ['258', '258A'];
  const isAllowed = allowedEmps.some(emp => 
    username === emp || username === emp.toLowerCase() || username.toUpperCase() === emp
  );
  
  if (!isAllowed) {
    return res.status(403).json({ message: 'Solo el empleado 258 puede cambiar contraseñas' });
  }
  
  try {
    // Support both parameter names: current or currentPassword
    const pwd = current || currentPassword;
    const ok = await validatePassword(username, pwd);
    if (!ok) return res.status(400).json({ message: 'Contraseña actual incorrecta' });
    const bcrypt = (await import('bcryptjs')).default;
    const newHash = await bcrypt.hash(newPassword, 10);
    const conn = await createCredConnection();
    await conn.execute('UPDATE users SET pass_hash = ? WHERE num_empleado = ? OR usuario = ?', [newHash, username, username]);
    await conn.end();
    res.json({ message: 'Contraseña cambiada correctamente' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error cambiando contraseña' });
  }
});

router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    if (req.user?.area && req.user.area.toLowerCase() === 'ensamble') {
      return res.status(403).json({ message: 'No tienes permiso para administrar usuarios' });
    }
    const conn = await createCredConnection();
    const [rows] = await conn.execute('SELECT num_empleado AS username, nombre, rol, area FROM users ORDER BY nombre ASC');
    await conn.end();
    const users = rows.map(u => ({ username: u.username, nombre: u.nombre, rol: u.rol, area: u.area || '', inventarioRol: ['Ingeniero', 'Administrador'].includes(u.rol) ? 'admin' : ['Calidad', 'Soporte', 'Lider', 'Operador', 'Recursos Humanos', 'Tool Room'].includes(u.rol) ? 'operador' : 'guest' }));
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error listando usuarios' });
  }
});

router.get('/info', authenticateToken, (req, res) => {
  res.json({ message: 'Los usuarios se gestionan desde el sistema de credenciales.', roles: { 'Administrador': 'Acceso total (admin)', 'Ingeniero': 'Acceso total (admin)', 'Lider': 'Puede editar (operador)', 'Operador': 'Puede editar (operador)', 'Invitado': 'Solo lectura (guest)' } });
});

router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    if (req.user?.area && req.user.area.toLowerCase() === 'ensamble') {
      return res.status(403).json({ message: 'No tienes permiso para administrar usuarios' });
    }
    const { nombre, num_empleado, password, rol, area } = req.body;
    
    // Validar campos requeridos
    if (!nombre || !num_empleado || !password || !rol) {
      return res.status(400).json({ message: 'Faltan campos requeridos: nombre, num_empleado, password, rol' });
    }
    
    // Validar rol
    const rolesValidos = ['AOI', 'Mantenimiento', 'Supervisor', 'Modula', 'Tecnico', 'Ingeniero', 'Administrador', 'Magazines', 'Calidad', 'Soporte', 'Lider', 'Operador', 'Invitado', 'Recursos Humanos', 'Tool Room'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ message: `Rol inválido. Debe ser uno de: ${rolesValidos.join(', ')}` });
    }
    
    // Hash de la contraseña
    const bcrypt = (await import('bcryptjs')).default;
    const pass_hash = await bcrypt.hash(password, 10);
    
    const conn = await createCredConnection();
    
    // Insertar usuario
    await conn.execute(
      'INSERT INTO users (nombre, num_empleado, pass_hash, rol, area) VALUES (?, ?, ?, ?, ?)',
      [nombre, num_empleado, pass_hash, rol, area || null]
    );
    
    await conn.end();
    
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (e) {
    console.error('Error creando usuario:', e);
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El usuario o número de empleado ya existe' });
    }
    res.status(500).json({ message: 'Error creando usuario' });
  }
});

router.put('/:username', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    if (req.user?.area && req.user.area.toLowerCase() === 'ensamble') {
      return res.status(403).json({ message: 'No tienes permiso para administrar usuarios' });
    }
    const { username } = req.params;
    const { nombre, num_empleado, password, rol, area } = req.body;
    
    // Validar campos requeridos
    if (!nombre || !num_empleado || !rol) {
      return res.status(400).json({ message: 'Faltan campos requeridos: nombre, num_empleado, rol' });
    }
    
    // Validar rol
    const rolesValidos = ['AOI', 'Mantenimiento', 'Supervisor', 'Modula', 'Tecnico', 'Ingeniero', 'Administrador', 'Magazines', 'Calidad', 'Soporte', 'Lider', 'Operador', 'Invitado', 'Recursos Humanos', 'Tool Room'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ message: `Rol inválido. Debe ser uno de: ${rolesValidos.join(', ')}` });
    }
    
    const conn = await createCredConnection();
    
    // Verificar que el usuario existe
    const [existing] = await conn.execute(
      'SELECT id FROM users WHERE num_empleado = ? LIMIT 1',
      [username]
    );
    
    if (!existing || existing.length === 0) {
      await conn.end();
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Actualizar usuario
    if (password) {
      // Si se proporciona nueva contraseña, hashearla y actualizar todo
      const bcrypt = (await import('bcryptjs')).default;
      const pass_hash = await bcrypt.hash(password, 10);
      await conn.execute(
        'UPDATE users SET nombre = ?, num_empleado = ?, pass_hash = ?, rol = ?, area = ? WHERE num_empleado = ?',
        [nombre, num_empleado, pass_hash, rol, area || null, username]
      );
    } else {
      // Si no se proporciona contraseña, no actualizar el hash
      await conn.execute(
        'UPDATE users SET nombre = ?, num_empleado = ?, rol = ?, area = ? WHERE num_empleado = ?',
        [nombre, num_empleado, rol, area || null, username]
      );
    }
    
    await conn.end();
    
    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (e) {
    console.error('Error actualizando usuario:', e);
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El usuario o número de empleado ya existe' });
    }
    res.status(500).json({ message: 'Error actualizando usuario' });
  }
});

router.delete('/:username', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    if (req.user?.area && req.user.area.toLowerCase() === 'ensamble') {
      return res.status(403).json({ message: 'No tienes permiso para administrar usuarios' });
    }
    const { username } = req.params;
    const { adminPassword } = req.body;
    
    if (!adminPassword) {
      return res.status(400).json({ message: 'Se requiere contraseña de administrador' });
    }
    
    // Validate the admin's password using num_empleado from JWT
    const ok = await validatePassword(req.user.username, adminPassword);
    if (!ok) return res.status(401).json({ message: 'Contraseña incorrecta' });
    
    const conn = await createCredConnection();
    
    // Find the user to delete
    const [existing] = await conn.execute(
      'SELECT id, nombre FROM users WHERE num_empleado = ? LIMIT 1',
      [username]
    );
    
    if (!existing || existing.length === 0) {
      await conn.end();
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Prevent deleting yourself
    if (username === req.user.username) {
      await conn.end();
      return res.status(400).json({ message: 'No puedes eliminarte a ti mismo' });
    }
    
    await conn.execute('DELETE FROM users WHERE num_empleado = ?', [username]);
    await conn.end();
    
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (e) {
    console.error('Error eliminando usuario:', e);
    res.status(500).json({ message: 'Error eliminando usuario' });
  }
});

export default router;
