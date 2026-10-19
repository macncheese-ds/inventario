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
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", 'data:', 'blob:', '*'],
    },
  },
}));
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

const PORT = process.env.PORT || 101;
app.listen(PORT, '0.0.0.0', () => console.log(`API on ${PORT}`));

