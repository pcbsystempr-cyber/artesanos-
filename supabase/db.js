 // ============================================================
//  Conexión a la base de datos
//  Usa PostgreSQL (driver pg). Funciona tanto con PostgreSQL
//  local como con Supabase apuntando DATABASE_URL al connection
//  string de Supabase. Toda la configuración de Supabase vive en
//  supabaseClient.js.
// ============================================================
require('dotenv').config();
const { Pool } = require('pg');

// Si no hay DATABASE_URL explícita, la derivamos desde SUPABASE_URL + DB_PASSWORD,
// igual que hace supabaseClient.js, para apuntar directo a la base de Supabase.
function deriveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
  if (supabaseUrl) {
    const host = supabaseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const password = process.env.DB_PASSWORD || 'postgres';
    return `postgresql://postgres:${password}@db.${host}:5432/postgres`;
  }
  return '';
}

const DATABASE_URL = deriveDatabaseUrl();

const poolConfig = DATABASE_URL
  ? {
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'artesanos',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

const pool = new Pool(poolConfig);

// Verifica la conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ No se pudo conectar a la base de datos:', err.message);
    console.error('   Revisa tu archivo .env y que PostgreSQL/Supabase esté accesible.');
  } else {
    console.log('✅ Conexión a la base de datos establecida.');
    release();
  }
});

module.exports = pool;
