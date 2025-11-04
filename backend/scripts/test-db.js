// backend/scripts/test-db.js
// Verifica conexión a MySQL y existencia de tablas básicas

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Carga variables del .env del backend
dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '1234',
  DB_NAME = 'inventario',
} = process.env;

async function main() {
  console.log('Probando conexión a MySQL con:');
  console.log({
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_NAME,
  });

  let conn;
  try {
    // Conexión al servidor y base seleccionada
    conn = await mysql.createConnection({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      namedPlaceholders: true,
    });

    console.log('✅ Conexión establecida.');

    // SELECT simple
    const [ping] = await conn.query('SELECT 1 AS ok');
    console.log('✅ SELECT 1:', ping);

    // Base actual
    const [dbNow] = await conn.query('SELECT DATABASE() AS db');
    console.log('📦 Base actual:', dbNow[0]?.db);

    // Listar tablas
    const [tables] = await conn.query('SHOW TABLES');
    const tableNames = tables.map((row) => Object.values(row)[0]);
    console.log('📋 Tablas encontradas:', tableNames);

    // Verificar tablas requeridas
    const required = ['users', 'gavetas', 'items'];
    const missing = required.filter((t) => !tableNames.includes(t));
    if (missing.length) {
      console.warn('⚠️ Faltan tablas:', missing, '\nRevisa que importaste backend/schema.sql');
      process.exitCode = 2;
    } else {
      console.log('🎉 Todas las tablas requeridas están presentes.');
    }
    // Comprobar que la columna precio está presente y calcular totales por gaveta y total general
    try {
      const [totals] = await conn.query(
        `SELECT gaveta, SUM(COALESCE(precio,0) * COALESCE(cantidad,0)) AS total_gaveta, SUM(cantidad) AS total_items
           FROM \`gavetas\`
           GROUP BY gaveta ORDER BY gaveta`);
      console.log('📊 Totales por gaveta:');
      totals.forEach(r => console.log(`  Gaveta ${r.gaveta}: total=${r.total_gaveta}, items=${r.total_items}`));
      const grand = totals.reduce((s, r) => s + Number(r.total_gaveta || 0), 0);
      console.log('🔢 Total general (precio*cantidad):', grand);
    } catch (e) {
      console.warn('No se pudo calcular totales por gaveta (verifica columna precio):', e.message || e);
    }
  } catch (err) {
    console.error('❌ Error conectando o consultando MySQL:\n', err?.message || err);
    console.error('\nSugerencias:');
    console.error('- Verifica que MySQL esté iniciado y el puerto sea correcto.');
    console.error('- Revisa backend/.env (usuario/contraseña/base).');
    console.error('- Si ves "caching_sha2_password cannot be loaded", crea el usuario con mysql_native_password.');
    process.exitCode = 1;
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}

main();
