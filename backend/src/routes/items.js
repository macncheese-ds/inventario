import { Router } from 'express';
import pool from '../db.js';
import mysql from 'mysql2/promise';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import { buildSearchClause } from '../utils/search.js';

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

// Helper para auditoría (ahora con adetalle y area)
async function logCambio(username, accion, detalle, turno = 'N/A', adetalle = null, area = null) {
  try {
    await pool.query(
      `INSERT INTO cambios (username, accion, detalle, fecha_hora, turno, adetalle, area)
       VALUES (:u, :a, :d, NOW(), :t, :ad, :area)` ,
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

// Listado con búsqueda y filtro por gaveta (número) - SIN LÍMITE para mostrar todos los registros
router.get('/', authenticateToken, async (req, res) => {
  const { q, gaveta } = req.query;
  const params = {};
  const where = ['1=1'];

  // Filtrar por área del usuario para evitar mostrar items de otras áreas con la misma gaveta
  // También mostrar items sin área asignada (para compatibilidad con datos antiguos)
  const userArea = req.user?.area || null;
  if (userArea) {
    where.push('(LOWER(g.area) = LOWER(:userArea) OR g.area IS NULL OR g.area = "")');
    params.userArea = userArea;
  }

  if (gaveta) { where.push('g.gaveta = :gaveta'); params.gaveta = gaveta; }

  const search = buildSearchClause(q, 'g');
  const whereSql = ` WHERE ${where.join(' AND ')} ${search.clause}`;
  Object.assign(params, search.params);

  try {
      const [rows] = await pool.query(
          `SELECT g.id, g.ndp, g.articulo, g.gaveta, g.nivel, g.cantidad, g.precio, g.\`min\` AS min, g.\`max\` AS max,
                  g.equipo, g.tde, g.link, g.linea,
                  IFNULL(o.ordered, 0) AS ordered, o.ordered_by, o.ordered_at
           FROM \`gavetas\` g
           LEFT JOIN \`orders\` o ON o.gaveta_id = g.id
          ${whereSql}
          ORDER BY g.nivel ASC, g.id ASC`,
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

// Crear ítem (admin/toolroom) - acepta multipart/form-data con campo 'image'
router.post('/', authenticateToken, authorizeRoles('admin','toolroom'), upload.single('image'), async (req, res) => {
  let { ndp, articulo, gaveta, nivel, cantidad, min, max, equipo, tde, link, turno, linea } = req.body;
  // Permitir nivel como valor alfanumérico (varchar) - puede ser vacío, número o texto
  if (nivel === '' || nivel === undefined || nivel === null) {
    nivel = null;
  } else {
    // Mantener como string para valores alfanuméricos
    nivel = String(nivel).trim();
  }
  // Obtener el área del usuario autenticado
  const area = req.user?.area || null;
  // Solo guardar linea si el usuario es del área Ensamble
  const isMantenimiento = req.user?.area === 'Ensamble';
  const finalLinea = isMantenimiento ? (linea || null) : null;
  let publicLink = link || null;
  if (req.file) {
    // ruta pública relativa al servidor
    publicLink = `/uploads/${req.file.filename}`;
  }
    try {
    const [result] = await pool.query(
      `INSERT INTO \`gavetas\` (ndp, articulo, gaveta, nivel, cantidad, precio, \`min\`, \`max\`, equipo, tde, link, area, linea)
       VALUES (:ndp,:articulo,:gaveta,:nivel,:cantidad,:precio,:min,:max,:equipo,:tde,:link,:area,:linea)`,
      { ndp, articulo, gaveta, nivel, cantidad, precio: Number(req.body.precio || 0), min, max, equipo, tde, link: publicLink, area, linea: finalLinea }
    );
    const [rows] = await pool.query(`SELECT * FROM \`gavetas\` WHERE id=:id`, { id: result.insertId });
    await logCambio(req.user.nombre || req.user.username, 'INSERT', rows[0], turno, null, req.user.area);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error creando ítem' });
  }
});

// Actualizar ítem (admin/toolroom)
router.put('/:id', authenticateToken, authorizeRoles('admin','toolroom'), upload.single('image'), async (req, res) => {
  const { id } = req.params;
  // si viene multipart, los campos estarán en req.body; si json, también
  let { ndp, articulo, gaveta, nivel, cantidad, precio, min, max, equipo, tde, link, turno, linea } = req.body;
  // Permitir nivel como valor alfanumérico (varchar) - puede ser vacío, número o texto
  if (nivel === '' || nivel === undefined || nivel === null) {
    nivel = null;
  } else {
    // Mantener como string para valores alfanuméricos
    nivel = String(nivel).trim();
  }
  // Solo guardar linea si el usuario es del área Ensamble
  const isMantenimiento = req.user?.area === 'Ensamble';
  const finalLinea = isMantenimiento ? (linea || null) : null;
  let publicLink = link || null;
  if (req.file) publicLink = `/uploads/${req.file.filename}`;
  try {
    // Obtener detalle anterior
    const [prev] = await pool.query(`SELECT * FROM \`gavetas\` WHERE id=:id`, { id });
      // si no se proporcionó nuevo link ni archivo, conservar el existente
      let finalLink = publicLink;
      if (!finalLink) {
        finalLink = prev[0] ? prev[0].link : null;
      }
      // Si no es Mantenimiento, conservar el valor anterior de linea
      const lineaToSave = isMantenimiento ? finalLinea : (prev[0]?.linea || null);

    await pool.query(
    `UPDATE \`gavetas\`
      SET ndp=:ndp, articulo=:articulo, gaveta=:gaveta, nivel=:nivel,
        cantidad=:cantidad, precio=:precio, \`min\`=:min, \`max\`=:max, equipo=:equipo, tde=:tde, link=:link, linea=:linea
    WHERE id=:id`,
    { ndp, articulo, gaveta, nivel, cantidad, precio: Number(precio || 0), min, max, equipo, tde, link: finalLink, linea: lineaToSave, id }
  );
    const [rows] = await pool.query(`SELECT * FROM \`gavetas\` WHERE id=:id`, { id });
    await logCambio(req.user.nombre || req.user.username, 'UPDATE', rows[0], turno, prev[0] || null, req.user.area);
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error actualizando ítem' });
  }
});

// Decrementar cantidad de ítem en 1 (operador/admin)
router.patch('/:id/decrement', authenticateToken, authorizeRoles('admin', 'toolroom'), async (req, res) => {
  const { id } = req.params;
  const { turno } = req.body;
  let cantidad = parseInt(req.body.cantidad, 10);
  if (!cantidad || isNaN(cantidad) || cantidad < 1) cantidad = 1;
  try {
    // Obtener item actual
    const [prev] = await pool.query(`SELECT * FROM \`gavetas\` WHERE id=:id`, { id });
    if (!prev.length) return res.status(404).json({ message: 'Ítem no encontrado' });

    const currentQty = prev[0].cantidad;
    if (currentQty <= 0) {
      return res.status(400).json({ message: 'La cantidad ya está en 0, no se puede decrementar más' });
    }
    if (cantidad > currentQty) {
      return res.status(400).json({ message: `Solo hay ${currentQty} unidades disponibles` });
    }

    const newQty = currentQty - cantidad;

    // Actualizar cantidad
    await pool.query(
      `UPDATE \`gavetas\` SET cantidad = :newQty WHERE id = :id`,
      { newQty, id }
    );

    const [updated] = await pool.query(`SELECT * FROM \`gavetas\` WHERE id=:id`, { id });

    // Log del cambio
    await logCambio(
      req.user.nombre || req.user.username, 
      'DECREMENT', 
      { 
        id, 
        ndp: prev[0].ndp, 
        articulo: prev[0].articulo, 
        cantidad_anterior: currentQty, 
        cantidad_nueva: newQty, 
        cantidad_retirada: cantidad
      }, 
      turno || 'N/A',
      prev[0],
      req.user.area
    );

    res.json({ 
      message: 'Cantidad decrementada exitosamente', 
      item: updated[0],
      cantidad_anterior: currentQty,
      cantidad_nueva: newQty,
      cantidad_retirada: cantidad
    });
  } catch (e) {
    console.error('Error decrementando cantidad:', e);
    res.status(500).json({ message: 'Error decrementando cantidad del ítem' });
  }
});

// Obtener notificaciones: items con cantidad <= min o sin stock
router.get('/notifications', authenticateToken, async (req, res) => {
  const userArea = req.user?.area || null;
  const params = {};
  const where = ['(g.cantidad <= g.`min` OR g.cantidad = 0)'];
  if (userArea) { where.push('(LOWER(g.area) = LOWER(:userArea) OR g.area IS NULL OR g.area = "")'); params.userArea = userArea; }
  const whereSql = ` WHERE ${where.join(' AND ')}`;
  try {
    const [rows] = await pool.query(
      `SELECT g.id, g.ndp, g.articulo, g.gaveta, g.nivel, g.cantidad, g.\`min\` AS min, g.\`max\` AS max,
              g.equipo, g.tde, g.area, IFNULL(o.ordered,0) AS ordered, o.ordered_by, o.ordered_at
         FROM \`gavetas\` g
         LEFT JOIN \`orders\` o ON o.gaveta_id = g.id
        ${whereSql}
        ORDER BY g.gaveta ASC, g.nivel ASC`,
      params
    );
    res.json({ data: rows, total: rows.length });
  } catch (e) {
    console.error('Error obteniendo notificaciones:', e);
    res.status(500).json({ message: 'Error obteniendo notificaciones' });
  }
});

// Marcar/Desmarcar ítem como ordenado
router.patch('/:id/ordered', authenticateToken, authorizeRoles('admin','toolroom'), async (req, res) => {
  const { id } = req.params; // gaveta id
  const { ordered, note } = req.body;
  try {
    // verificar que el ítem existe
    const [prev] = await pool.query(`SELECT * FROM \`gavetas\` WHERE id=:id`, { id });
    if (!prev.length) return res.status(404).json({ message: 'Ítem no encontrado' });

    if (ordered) {
      // insert or update
      await pool.query(
        `INSERT INTO \`orders\` (gaveta_id, ordered, ordered_by, ordered_at, note)
         VALUES (:id, 1, :user, NOW(), :note)
         ON DUPLICATE KEY UPDATE ordered=1, ordered_by=:user, ordered_at=NOW(), note=:note`,
        { id, user: req.user.nombre || req.user.username, note: note || null }
      );
      await logCambio(req.user.nombre || req.user.username, 'ORDER', { id, articulo: prev[0].articulo }, 'N/A', null, req.user.area);
    } else {
      // remove order row (or mark as not ordered)
      await pool.query(`DELETE FROM \`orders\` WHERE gaveta_id = :id`, { id });
      await logCambio(req.user.nombre || req.user.username, 'CANCEL_ORDER', { id, articulo: prev[0].articulo }, 'N/A', null, req.user.area);
    }

    const [[updated]] = await pool.query(
      `SELECT g.*, IFNULL(o.ordered,0) AS ordered, o.ordered_by, o.ordered_at FROM \`gavetas\` g LEFT JOIN \`orders\` o ON o.gaveta_id=g.id WHERE g.id=:id`,
      { id }
    );
    res.json({ message: 'OK', item: updated });
  } catch (e) {
    console.error('Error marcando ordenado:', e);
    res.status(500).json({ message: 'Error actualizando estado de orden' });
  }
});

// Eliminar ítem (admin u operador)
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'toolroom'), async (req, res) => {
  const { id } = req.params;
  try {
    const [prev] = await pool.query(`SELECT * FROM \`gavetas\` WHERE id=:id`, { id });
    if (!prev.length) return res.status(404).json({ message: 'Ítem no encontrado' });

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
    await logCambio(req.user.nombre || req.user.username, 'DELETE', { id }, 'N/A', prev[0] || null, req.user.area);
    res.json({ message: 'Ítem eliminado' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error eliminando ítem' });
  }
});

// Endpoint para exportar a Excel (solo operadores y admins)
router.get('/export/excel', authenticateToken, authorizeRoles(['toolroom', 'admin']), async (req, res) => {
  console.log('🔍 Export Excel - User:', req.user);
  console.log('🔍 Export Excel - User role:', req.user?.rol);
  console.log('🔍 Export Excel - User area:', req.user?.area);
  console.log('🔍 Export Excel - Query params:', req.query);
  
  try {
    const { q, gaveta } = req.query;
    const userArea = req.user?.area || null;
    const params = {};
    const where = ['1=1'];

    // Filtrar por área del usuario si tiene una asignada
    // También mostrar items sin área asignada (para compatibilidad con datos antiguos)
    if (userArea) {
      where.push('(LOWER(g.area) = LOWER(:userArea) OR g.area IS NULL OR g.area = "")');
      params.userArea = userArea;
    }

    if (gaveta) { 
      where.push('g.gaveta = :gaveta'); 
      params.gaveta = gaveta; 
    }

    const search = buildSearchClause(q, 'g');
    const whereSql = ` WHERE ${where.join(' AND ')} ${search.clause}`;
    Object.assign(params, search.params);

    console.log('🔍 Export Excel - SQL params:', params);

    // Obtener datos filtrados por área del usuario
    const [rows] = await pool.query(
   `SELECT g.ndp, g.articulo, g.gaveta, g.nivel, g.cantidad, g.precio, g.\`min\` AS min, g.\`max\` AS max,
        g.equipo, g.tde, g.area,
        IFNULL(o.ordered, 0) AS ordered, o.ordered_by, o.ordered_at
      FROM \`gavetas\` g
      LEFT JOIN \`orders\` o ON o.gaveta_id = g.id
      ${whereSql}
      ORDER BY g.gaveta ASC, g.nivel ASC`,
      params
    );

    console.log('🔍 Export Excel - Found rows:', rows.length);

    // Crear workbook con ExcelJS
    const workbook = new ExcelJS.Workbook();

    // Agrupar datos por gaveta
    const gavetaGroups = {};
    rows.forEach(row => {
      const gaveta = row.gaveta;
      if (!gavetaGroups[gaveta]) {
        gavetaGroups[gaveta] = [];
      }
      gavetaGroups[gaveta].push(row);
    });

    // Crear una hoja por cada gaveta (sanitizar nombre para evitar duplicados y caracteres inválidos)
    // Ordenar alfabéticamente
    const usedNames = new Set();
    Object.keys(gavetaGroups).sort((a, b) => {
      return String(a).localeCompare(String(b), 'es', { sensitivity: 'base' });
    }).forEach(gaveta => {
      // Sanitizar nombre de hoja (max 31 chars, sin caracteres especiales)
      let sheetName = String(gaveta).replace(/[\[\]\*\?\/\\:]/g, '_').substring(0, 31);
      // Evitar duplicados agregando sufijo numérico si es necesario
      let finalName = sheetName;
      let counter = 1;
      while (usedNames.has(finalName.toLowerCase())) {
        finalName = `${sheetName.substring(0, 28)}_${counter}`;
        counter++;
      }
      usedNames.add(finalName.toLowerCase());
      
      const worksheet = workbook.addWorksheet(finalName);
      
      // Definir las columnas (incluye Precio y Total por ítem)
      worksheet.columns = [
        { header: 'NDP', key: 'ndp', width: 15 },
        { header: 'Artículo', key: 'articulo', width: 35 },
        { header: 'Nivel', key: 'nivel', width: 8 },
        { header: 'Cantidad', key: 'cantidad', width: 12 },
        { header: 'Precio', key: 'precio', width: 12 },
        { header: 'Total', key: 'total', width: 14 },
        { header: 'Mínimo', key: 'min', width: 10 },
        { header: 'Máximo', key: 'max', width: 10 },
        { header: 'Equipo', key: 'equipo', width: 20 },
        { header: 'TDE', key: 'tde', width: 15 },
        { header: 'Ordered', key: 'ordered', width: 10 },
        { header: 'Ordered By', key: 'ordered_by', width: 20 },
        { header: 'Ordered At', key: 'ordered_at', width: 20 }
      ];

      // Agregar los datos de esta gaveta y calcular totales
      gavetaGroups[gaveta].forEach(row => {
        const precio = Number(row.precio || 0);
        const total = Number(row.cantidad || 0) * precio;
        worksheet.addRow({
          ndp: row.ndp,
          articulo: row.articulo,
          nivel: row.nivel,
          cantidad: row.cantidad,
          precio: precio,
          total: total,
          min: row.min,
          max: row.max,
          equipo: row.equipo || '',
          tde: row.tde || '',
          ordered: row.ordered ? 'Yes' : 'No',
          ordered_by: row.ordered_by || '',
          ordered_at: row.ordered_at ? new Date(row.ordered_at).toLocaleString() : ''
        });
      });

      // Agregar fila de sumatoria al final con el total de la gaveta
      const startDataRow = 2;
      const endDataRow = worksheet.rowCount;
      const totalCell = `F${endDataRow + 1}`; // columna F es 'Total'
      worksheet.addRow({});
      const sumRow = worksheet.addRow({ articulo: 'TOTAL GAVETA', total: { formula: `SUM(F${startDataRow}:F${endDataRow})` } });
      // Aplicar formato numérico a la columna Precio y Total
      worksheet.getColumn('precio').numFmt = '#,##0.00';
      worksheet.getColumn('total').numFmt = '#,##0.00';

      // Aplicar estilos al header
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Aplicar bordes a todas las celdas de datos
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    // Generar buffer del archivo Excel
    const buffer = await workbook.xlsx.writeBuffer();

    // Configurar headers para descarga
    const filename = `inventario_gavetas_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);

    console.log('🔍 Export Excel - Sending file:', filename);

    // Registrar la exportación en el historial
    await logCambio(
      req.user.nombre || req.user.username, 
      'EXPORTAR_EXCEL', 
      `Exportó ${rows.length} registros a Excel (área: ${userArea || 'todas'})`,
      'N/A',
      { filtros: { q, area: userArea }, total_registros: rows.length, gavetas: Object.keys(gavetaGroups).length },
      req.user.area
    );

    res.send(buffer);
  } catch (e) {
    console.error('❌ Error exportando a Excel:', e);
    res.status(500).json({ message: 'Error exportando datos a Excel' });
  }
});

export default router;
