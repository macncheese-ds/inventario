import mysql from 'mysql2/promise';

// Conexión a la base de datos de credenciales. Usa las mismas variables DB_* que el pool principal;
// no hay valores por defecto de usuario o contraseña, para no intentar entrar con root sin clave.
export async function createCredConnection() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.CRED_DB_NAME || 'credenciales'
  };
  return await mysql.createConnection(config);
}
