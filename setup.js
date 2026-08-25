const { bcrypt } = require('./supabase/auth');
const pool = require('./supabase/db');
const supabase = require('./supabase/supabaseClient');

// Si hay configuración de Supabase, creamos los usuarios vía supabaseClient
// (que ejecuta users.sql con pgcrypto). De lo contrario usamos el pool local.
async function ensureUsers() {
  if (supabase.DATABASE_URL) {
    console.log('   Usando Supabase para crear usuarios...');
    await supabase.runUsers();
    return;
  }

  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const artUser = process.env.ARTISAN_USER || 'artesano';
  const artPass = process.env.ARTISAN_PASSWORD || 'artesano123';

  const hash = async (p) => bcrypt.hash(p, 10);

  async function upsert(username, password, role) {
    const exists = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    const password_hash = await hash(password);
    if (exists.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        [username, password_hash, role]
      );
      console.log(`   Usuario "${username}" (${role}) creado.`);
    } else {
      await pool.query('UPDATE users SET password_hash = $1 WHERE username = $2', [password_hash, username]);
      console.log(`   Usuario "${username}" ya existe (contraseña actualizada).`);
    }
  }

  await upsert(adminUser, adminPass, 'admin');
  await upsert(artUser, artPass, 'artisan');
}

(async () => {
  try {
    console.log('🔧 Configurando usuarios por defecto...');
    await ensureUsers();
    console.log('✅ Listo. Ya puedes iniciar el servidor con: npm start');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error en setup:', e.message);
    process.exit(1);
  }
})();
