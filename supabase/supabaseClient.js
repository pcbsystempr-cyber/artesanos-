// ============================================================
//  Cliente y utilidades de Supabase
//  Centraliza TODA la configuración e instrucciones relacionadas
//  con la base de datos de Supabase (conexión, ejecución de
//  scripts SQL y cliente para consultas).
//
//  Uso en backend (Node):
//    const supabase = require('./supabaseClient');
//    await supabase.runSchema();   // crea tablas, triggers y RLS
//    await supabase.runSeed();     // inserta datos de ejemplo
//    await supabase.runUsers();    // crea usuarios por defecto
//    const { data } = await supabase.supabaseAdmin.from('announcements').select('*');
//
//  El cliente de navegador usa window.supabase (supabase-js v2 por CDN).
// ============================================================


require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// ------------------------------------------------------------
//  Configuración (lee el .env)
//  Soporta el formato estándar (SUPABASE_ANON_KEY / SUPABASE_SERVICE_KEY)
//  y el formato de Supabase CLI (SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY).
// ------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cotocvlsdqtglomvenfd.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_8M0ljA29Inn5kF5WfICK3g_3OY1wWsd';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY || SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvdG9jdmxzZHF0Z2xvbXZlbmZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNTg4NjYsImV4cCI6MjEwMjczNDg2Nn0.k5-k-XErmO9tFtUwM9rSJFW8kLAXT8j2NxCmedPpkUQ';

// DATABASE_URL: si no está definida, se deriva del connection string de Supabase.
// Formato: postgresql://postgres:[PASSWORD]@db.[PROYECTO].supabase.co:5432/postgres
function deriveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (!SUPABASE_URL) return '';
  const host = SUPABASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
  // La SECRET/PUBLISHABLE key no es la contraseña de Postgres. Supabase usa la
  // contraseña del usuario postgres definida en el dashboard (DB_PASSWORD).
  const password = process.env.DB_PASSWORD || 'postgres';
  return `postgresql://postgres:${password}@db.${host}:5432/postgres`;
}
const DATABASE_URL = deriveDatabaseUrl();

// ------------------------------------------------------------
//  Clientes supabase-js
// ------------------------------------------------------------
let supabase = null;        // Cliente público (ANON KEY) - respeta RLS
let supabaseAdmin = null;   // Cliente admin (SERVICE KEY) - salta RLS

function initClients() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    }
  } catch (e) {
    console.warn('⚠️  @supabase/supabase-js no instalado. Ejecuta: npm install @supabase/supabase-js');
  }
  return { supabase, supabaseAdmin };
}
initClients();

// ------------------------------------------------------------
//  Pool de PostgreSQL (para ejecutar scripts SQL crudos en Supabase)
// ------------------------------------------------------------
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// ------------------------------------------------------------
//  Scripts SQL (en la carpeta raíz del proyecto)
// ------------------------------------------------------------
const SCHEMA_SQL = path.join(__dirname, 'schema.sql');
const SEED_SQL = path.join(__dirname, 'seed.sql');
const USERS_SQL = path.join(__dirname, 'users.sql');
// (estos archivos viven junto a este módulo dentro de /supabase)

// Divide un script SQL en sentencias individuales respetando $$ (bloques plpgsql)
function splitSql(sql) {
  const statements = [];
  let current = '';
  let inDollar = false;
  let dollarTag = '';
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    if (!inDollar && ch === '$') {
      const tagMatch = /^\$[A-Za-z0-9_]*\$/.exec(sql.slice(i));
      if (tagMatch) {
        inDollar = true;
        dollarTag = tagMatch[0];
        current += tagMatch[0];
        i += tagMatch[0].length;
        continue;
      }
    }
    if (inDollar && sql.startsWith(dollarTag, i)) {
      inDollar = false;
      current += dollarTag;
      i += dollarTag.length;
      continue;
    }
    current += ch;
    if (!inDollar && ch === ';') {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = '';
    }
    i++;
  }
  const last = current.trim();
  if (last) statements.push(last);
  return statements;
}

// Ejecuta un archivo SQL completo en Supabase vía el pool de PostgreSQL
async function runSqlFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`No se encontró el archivo SQL: ${filePath}`);
  }
  if (!DATABASE_URL) {
    throw new Error('No hay DATABASE_URL (ni SUPABASE_URL con DB_PASSWORD) configurado en .env.');
  }
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = splitSql(sql);
  const client = await pool.connect();
  const executed = [];
  try {
    for (const stmt of statements) {
      await client.query(stmt);
      executed.push(stmt.slice(0, 60));
    }
  } finally {
    client.release();
  }
  return executed;
}

// Ejecuta el esquema (tablas, triggers, RLS)
async function runSchema() {
  console.log('📐 Creando esquema en Supabase...');
  const res = await runSqlFile(SCHEMA_SQL);
  console.log(`   ${res.length} sentencias ejecutadas.`);
  return res;
}

// Inserta los datos de ejemplo
async function runSeed() {
  console.log('🌱 Insertando datos de ejemplo...');
  const res = await runSqlFile(SEED_SQL);
  console.log(`   ${res.length} sentencias ejecutadas.`);
  return res;
}

// Crea los usuarios por defecto (admin / artesano)
async function runUsers() {
  console.log('👤 Creando usuarios por defecto...');
  const res = await runSqlFile(USERS_SQL);
  console.log(`   ${res.length} sentencias ejecutadas.`);
  return res;
}

// Helper: consulta SELECT simple devolviendo filas (usando supabase-js)
async function select(table, columns = '*', orderBy = null) {
  let query = (supabaseAdmin || supabase).from(table).select(columns);
  if (orderBy) query = query.order(orderBy);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

module.exports = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY,
  DATABASE_URL,
  supabase,
  supabaseAdmin,
  pool,
  initClients,
  runSchema,
  runSeed,
  runUsers,
  runSqlFile,
  select,
  SCHEMA_SQL,
  SEED_SQL,
  USERS_SQL,
};
