// backend/scripts/add-admin.js
// Script para agregar un usuario admin con contraseña admin123

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Carga variables del .env del backend
dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '6235642',
  DB_NAME = 'inventario',
} = process.env;

async function main() {
  const username = 'admin';
  const password = 'admin123';
  const rol = 'admin';
  const nombre = 'Administrador';

  const bcrypt = (await import('bcryptjs')).default;
  const hash = await bcrypt.hash(password, 10);

  let conn;
  try {
    conn = await mysql.createConnection({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      namedPlaceholders: true,
    });

    // Verifica si ya existe el usuario admin
    const [rows] = await conn.execute('SELECT * FROM users WHERE username = :u', { u: username });
    if (rows.length > 0) {
      console.log('El usuario admin ya existe.');
      return;
    }

    await conn.execute(
      'INSERT INTO users (username, pass_hash, rol, nombre) VALUES (:u, :p, :r, :n)',
      { u: username, p: hash, r: rol, n: nombre }
    );
    console.log('Usuario admin creado exitosamente.');
  } catch (e) {
    console.error('Error creando usuario admin:', e);
  } finally {
    if (conn) await conn.end();
  }
}

main();
