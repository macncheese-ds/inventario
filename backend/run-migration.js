import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file for database config
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const config = {
  host: env.DB_HOST || 'localhost',
  port: parseInt(env.DB_PORT || '3306', 10),
  user: env.DB_USER || 'root',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'inventario'
};

async function runMigration() {
  let conn;
  try {
    console.log('🔄 Connecting to database...');
    console.log(`   Host: ${config.host}, Port: ${config.port}, DB: ${config.database}`);
    
    conn = await mysql.createConnection(config);
    console.log('✓ Connected\n');

    // Read the migration SQL
    const migrationPath = path.join(__dirname, 'schema.sql', 'fix_prestamos_columns.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Running migration SQL...\n');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed) continue;
      
      console.log(`Executing: ${trimmed.substring(0, 60)}...`);
      try {
        await conn.execute(trimmed);
        console.log('✓ Success\n');
      } catch (e) {
        if (e.message.includes('Duplicate column name')) {
          console.log('⚠️  Column already exists (expected if already migrated)\n');
        } else {
          console.error('❌ Error:', e.message, '\n');
        }
      }
    }
    
    console.log('✓ Migration completed!');
    console.log('\n🔍 Verifying prestamos table structure:');
    const [rows] = await conn.execute('DESCRIBE prestamos');
    console.table(rows.map(r => ({ Field: r.Field, Type: r.Type, Null: r.Null })));
    
  } catch (e) {
    console.error('❌ Migration failed:', e.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

runMigration();
