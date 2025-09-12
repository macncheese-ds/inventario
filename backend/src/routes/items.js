import { Router } from 'express';
import pool from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import { buildSearchClause } from '../utils/search.js';

const router = Router();

// configurar multer: guardar en backend/uploads
const UPLOAD_DIR = path.join(path.resolve(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `item-${Date.now()}-${Math.floor(Math.random()*1e6)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// Helper para auditoría (ahora con adetalle)
async function logCambio(username, accion, detalle, turno = 'N/A', adetalle = null) {
  try {
    await pool.query(
      `INSERT INTO cambios (username, accion, detalle, fecha_hora, turno, adetalle)
       VALUES (:u, :a, :d, NOW(), :t, :ad)` ,
      { u: username, a: accion, d: typeof detalle === 'string' ? detalle : JSON.stringify(detalle), t: turno, ad: adetalle ? (typeof adetalle === 'string' ? adetalle : JSON.stringify(adetalle)) : null }
    );
  } catch (e) {
    console.error('Log cambio fallo:', e.message);
  }
}

// Listado con búsqueda y filtro por gaveta (número)
router.get('/', authenticateToken, async (req, res) => {
  const { q, gaveta, page = 1, pageSize = 100 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const params = { limit: parseInt(pageSize), offset };
  const where = ['1=1'];

  if (gaveta) { where.push('g.gaveta = :gaveta'); params.gaveta = Number(gaveta); }

  const search = buildSearchClause(q, 'g');
  const whereSql = ` WHERE ${where.join(' AND ')} ${search.clause}`;
  Object.assign(params, search.params);

  try {
    const [rows] = await pool.query(
      `SELECT g.id, g.ndp, g.articulo, g.gaveta, g.nivel, g.cantidad, g.\`min\` AS min, g.\`max\` AS max,
              g.equipo, g.tde, g.link
         FROM \`gavetas\` g
        ${whereSql}
        ORDER BY g.id DESC
        LIMIT :limit OFFSET :offset`,
      params
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM \`gavetas\` g
        ${whereSql}`,
      params
    );

    res.json({ data: rows, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error listando inventario' });
  }
});

// Crear ítem (admin/operador) - acepta multipart/form-data con campo 'image'
router.post('/', authenticateToken, authorizeRoles('admin','operador'), upload.single('image'), async (req, res) => {
  const { ndp, articulo, gaveta, nivel, cantidad, min, max, equipo, tde, link, turno } = req.body;
  let publicLink = link || null;
  if (req.file) {
    // ruta pública relativa al servidor
    publicLink = `/uploads/${req.file.filename}`;
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO \`gavetas\` (ndp, articulo, gaveta, nivel, cantidad, \`min\`, \`max\`, equipo, tde, link)
       VALUES (:ndp,:articulo,:gaveta,:nivel,:cantidad,:min,:max,:equipo,:tde,:link)`,
      { ndp, articulo, gaveta, nivel, cantidad, min, max, equipo, tde, link: publicLink }
    );
    const [rows] = await pool.query(`SELECT * FROM \`gavetas\` WHERE id=:id`, { id: result.insertId });
    await logCambio(req.user.username, 'INSERT', rows[0], turno);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error creando ítem' });
  }
});

// Actualizar ítem (admin/operador)
router.put('/:id', authenticateToken, authorizeRoles('admin','operador'), upload.single('image'), async (req, res) => {
  const { id } = req.params;
  // si viene multipart, los campos estarán en req.body; si json, también
  const { ndp, articulo, gaveta, nivel, cantidad, min, max, equipo, tde, link, turno, password } = req.body;
  let publicLink = link || null;
  if (req.file) publicLink = `/uploads/${req.file.filename}`;
  try {
    // Validar contraseña del usuario actual
    const [userRows] = await pool.query('SELECT pass_hash FROM users WHERE username=:u', { u: req.user.username });
    if (!userRows.length) return res.status(401).json({ message: 'Usuario no encontrado' });
    const bcrypt = (await import('bcryptjs')).default;
    const hash = Buffer.isBuffer(userRows[0].pass_hash) ? userRows[0].pass_hash.toString() : userRows[0].pass_hash;
    const ok = await bcrypt.compare(password, hash);
    if (!ok) return res.status(401).json({ message: 'Contraseña incorrecta' });

    // Obtener detalle anterior
    const [prev] = await pool.query(`SELECT * FROM \`gavetas\` WHERE id=:id`, { id });
      // si no se proporcionó nuevo link ni archivo, conservar el existente
      let finalLink = publicLink;
      if (!finalLink) {
        finalLink = prev[0] ? prev[0].link : null;
      }

      await pool.query(
      `UPDATE \`gavetas\`
          SET ndp=:ndp, articulo=:articulo, gaveta=:gaveta, nivel=:nivel,
              cantidad=:cantidad, \`min\`=:min, \`max\`=:max, equipo=:equipo, tde=:tde, link=:link
        WHERE id=:id`,
        { ndp, articulo, gaveta, nivel, cantidad, min, max, equipo, tde, link: finalLink, id }
    );
    const [rows] = await pool.query(`SELECT * FROM \`gavetas\` WHERE id=:id`, { id });
    await logCambio(req.user.username, 'UPDATE', rows[0], turno, prev[0] || null);
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error actualizando ítem' });
  }
});

// Eliminar ítem (solo admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  try {
    // Validar contraseña del usuario actual
    const [userRows] = await pool.query('SELECT pass_hash FROM users WHERE username=:u', { u: req.user.username });
    if (!userRows.length) return res.status(401).json({ message: 'Usuario no encontrado' });
    const bcrypt = (await import('bcryptjs')).default;
    const hash = Buffer.isBuffer(userRows[0].pass_hash) ? userRows[0].pass_hash.toString() : userRows[0].pass_hash;
    const ok = await bcrypt.compare(password, hash);
    if (!ok) return res.status(401).json({ message: 'Contraseña incorrecta' });

  const [prev] = await pool.query(`SELECT * FROM \`gavetas\` WHERE id=:id`, { id });
  // eliminar registro
  await pool.query(`DELETE FROM \`gavetas\` WHERE id=:id`, { id });
  // si tenía imagen subida, intentar eliminar archivo del sistema
  try {
    const link = prev[0] && prev[0].link ? prev[0].link : null;
    if (link && link.startsWith('/uploads/')) {
      const filename = link.split('/').pop();
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (e) {
    console.warn('Error eliminando archivo asociado al ítem:', e.message);
  }
  await logCambio(req.user.username, 'DELETE', { id }, 'N/A', prev[0] || null);
  res.json({ message: 'Ítem eliminado' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error eliminando ítem' });
  }
});

export default router;
