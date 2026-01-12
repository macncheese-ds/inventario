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

app.use(helmet({
  xssFilter: false, // Remove x-xss-protection header
  hidePoweredBy: true, // Remove x-powered-by header
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  contentSecurityPolicy: false // Configure separately if needed
}));

// Add custom security and performance headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Default cache for dynamic content
  next();
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// servir archivos estáticos de uploads (imágenes) con headers CORS y cache-control
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.header('Cache-Control', 'public, max-age=31536000, immutable'); // Long-term cache for static uploads
  next();
}, express.static(path.join(path.resolve(), 'uploads')));

// Serve static assets (JS, CSS) with immutable cache-control header
app.use('/assets', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  next();
}, express.static(path.join(path.resolve(), '../frontend/dist/assets')));

// Favicon with proper content-type and cache control
app.get('/favicon.ico', (req, res) => {
  res.setHeader('Content-Type', 'image/x-icon');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.status(204).end(); // Return 204 No Content if no favicon file exists
});

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

const PORT = process.env.PORT || 101;
app.listen(PORT, '0.0.0.0', () => console.log(`API on ${PORT}`));

