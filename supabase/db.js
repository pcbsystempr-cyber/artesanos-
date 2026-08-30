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

// Timeouts para que la app falle rápido en vez de quedarse "cargando"
// indefinidamente cuando la base de datos no es accesible.
const TIMEOUTS = {
  connectionTimeoutMillis: 10000, // 10s para establecer conexión
  query_timeout: 15000,           // 15s máximo por consulta
};

const poolConfig = DATABASE_URL
  ? {
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      ...TIMEOUTS,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'artesanos',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ...TIMEOUTS,
    };

const pool = new Pool(poolConfig);

// Evita que un error en un cliente inactivo del pool tumbe el proceso.
pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err.message);
});

if (!DATABASE_URL) {
  console.warn('⚠️  No hay DATABASE_URL ni SUPABASE_URL en .env: se intentará PostgreSQL local (localhost:5432).');
}

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
