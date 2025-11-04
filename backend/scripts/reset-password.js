#!/usr/bin/env node
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

dotenv.config();

async function main() {
  try {
    const args = process.argv.slice(2);
    if (args.length < 2) {
      console.error('Usage: node scripts/reset-password.js <username|num_empleado> <newPassword>');
      process.exit(2);
    }

    const [userKey, newPassword] = args;

    if (newPassword.length < 8) {
      console.warn('Warning: password length < 8 characters. Consider using a stronger password.');
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const hash = await bcrypt.hash(newPassword, saltRounds);

    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.CRED_DB_NAME || 'credenciales'
    });

    const [result] = await conn.execute(
      'UPDATE users SET pass_hash = ? WHERE usuario = ? OR num_empleado = ?',
      [hash, userKey, userKey]
    );

    await conn.end();

    if (result && result.affectedRows && result.affectedRows > 0) {
      console.log(`Password updated for ${userKey}. Affected rows: ${result.affectedRows}`);
    } else {
      console.error('No rows updated. Verify that the username or employee number exists.');
      process.exit(3);
    }
  } catch (err) {
    console.error('Error updating password:', err);
    process.exit(1);
  }
}

main();
