import historialRoutes from './routes/historial.js';
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import pool from './db.js';

import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import gavetaRoutes from './routes/gavetas.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/upload.js';
import prestamosRoutes from './routes/prestamos.js';

dotenv.config();
const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// servir archivos estáticos de uploads (imágenes) con headers CORS
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
}, express.static(path.join(path.resolve(), 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/gavetas', gavetaRoutes);
app.use('/api/users', userRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/prestamos', prestamosRoutes);

// Crea admin por única vez: username=admin, pass=admin123
app.post('/api/dev/seed-admin', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT username FROM users WHERE username="admin"');
    if (rows.length) return res.json({ message: 'Admin ya existe' });

    const bcrypt = (await import('bcryptjs')).default;
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
      'INSERT INTO users (username, pass_hash, rol, nombre) VALUES ("admin", :p, "admin", "Administrador")',
      { p: hash }
    );
    res.json({ message: 'Admin creado', username: 'admin', password: 'admin123' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error creando admin' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`API on ${PORT}`));

