import { Router } from 'express';
import pool from '../db.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';
dotenv.config();

const router = Router();

router.post(
  '/login',
  body('username').isString().notEmpty(),
  body('password').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { username, password } = req.body;

    try {
      const [rows] = await pool.query(
        'SELECT username, pass_hash, rol, nombre FROM users WHERE username=:u',
        { u: username }
      );
      if (!rows.length) return res.status(401).json({ message: 'Credenciales inválidas' });

      const user = rows[0];
      const bcrypt = (await import('bcryptjs')).default;
      const hash = Buffer.isBuffer(user.pass_hash) ? user.pass_hash.toString() : user.pass_hash;
      const ok = await bcrypt.compare(password, hash);
      if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

      const token = jwt.sign(
        { username: user.username, rol: user.rol, nombre: user.nombre },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );
      res.json({ token, user: { username: user.username, rol: user.rol, nombre: user.nombre } });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Error de servidor' });
    }
  }
);

export default router;
