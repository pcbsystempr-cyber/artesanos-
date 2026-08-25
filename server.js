
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const pool = require('./supabase/db');
const { bcrypt, signToken, authenticate, requireAdmin, requireArtisan } = require('./supabase/auth');

const app = express();

// ============================================================
//  Middlewares globales
// ============================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend y uploads (en la carpeta raíz)
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de subida de archivos (multer)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// ============================================================
//  AUTENTICACIÓN
// ============================================================

// Login unificado: devuelve token según rol
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Faltan credenciales' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = signToken(user);
    res.json({ token, role: user.role, username: user.username });
  } catch (e) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Verifica si el token es válido y devuelve el usuario
app.get('/api/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// ============================================================
//  ANUNCIOS (público: lectura / admin: CRUD)
// ============================================================
app.get('/api/announcements', async (req, res) => {
  const result = await pool.query('SELECT * FROM announcements ORDER BY is_urgent DESC, published_at DESC');
  res.json(result.rows);
});

app.post('/api/announcements', authenticate, requireAdmin, async (req, res) => {
  const { title, body, published_at, is_urgent } = req.body;
  const result = await pool.query(
    'INSERT INTO announcements (title, body, published_at, is_urgent) VALUES ($1,$2,$3,$4) RETURNING *',
    [title, body, published_at || null, !!is_urgent]
  );
  res.json(result.rows[0]);
});

app.put('/api/announcements/:id', authenticate, requireAdmin, async (req, res) => {
  const { title, body, published_at, is_urgent } = req.body;
  const result = await pool.query(
    'UPDATE announcements SET title=$1, body=$2, published_at=$3, is_urgent=$4 WHERE id=$5 RETURNING *',
    [title, body, published_at, !!is_urgent, req.params.id]
  );
  res.json(result.rows[0]);
});

app.delete('/api/announcements/:id', authenticate, requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM announcements WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// ============================================================
//  INFORMACIÓN DEL PROGRAMA
// ============================================================
app.get('/api/program-info', async (req, res) => {
  const result = await pool.query('SELECT * FROM program_info ORDER BY id');
  res.json(result.rows);
});

app.put('/api/program-info/:id', authenticate, requireAdmin, async (req, res) => {
  const { title, content } = req.body;
  const result = await pool.query(
    'UPDATE program_info SET title=$1, content=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
    [title, content, req.params.id]
  );
  res.json(result.rows[0]);
});

// ============================================================
//  REQUISITOS
// ============================================================
app.get('/api/requirements', async (req, res) => {
  const result = await pool.query('SELECT * FROM requirements ORDER BY category, sort_order');
  res.json(result.rows);
});

app.post('/api/requirements', authenticate, requireAdmin, async (req, res) => {
  const { category, title, description, sort_order } = req.body;
  const result = await pool.query(
    'INSERT INTO requirements (category, title, description, sort_order) VALUES ($1,$2,$3,$4) RETURNING *',
    [category, title, description, sort_order || 0]
  );
  res.json(result.rows[0]);
});

app.put('/api/requirements/:id', authenticate, requireAdmin, async (req, res) => {
  const { category, title, description, sort_order } = req.body;
  const result = await pool.query(
    'UPDATE requirements SET category=$1, title=$2, description=$3, sort_order=$4 WHERE id=$5 RETURNING *',
    [category, title, description, sort_order, req.params.id]
  );
  res.json(result.rows[0]);
});

app.delete('/api/requirements/:id', authenticate, requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM requirements WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// ============================================================
//  ARTESANOS ACTUALES
// ============================================================
app.get('/api/artisans', async (req, res) => {
  const result = await pool.query('SELECT * FROM artisans WHERE is_active = TRUE ORDER BY name');
  res.json(result.rows);
});

app.post('/api/artisans', authenticate, requireAdmin, upload.single('photo'), async (req, res) => {
  const { name, specialty, description } = req.body;
  const photo = req.file ? '/uploads/' + req.file.filename : (req.body.photo || '');
  const result = await pool.query(
    'INSERT INTO artisans (name, specialty, description, photo) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, specialty, description, photo]
  );
  res.json(result.rows[0]);
});

app.put('/api/artisans/:id', authenticate, requireAdmin, upload.single('photo'), async (req, res) => {
  const { name, specialty, description } = req.body;
  const photo = req.file ? '/uploads/' + req.file.filename : (req.body.photo || null);
  let query, params;
  if (photo) {
    query = 'UPDATE artisans SET name=$1, specialty=$2, description=$3, photo=$4 WHERE id=$5 RETURNING *';
    params = [name, specialty, description, photo, req.params.id];
  } else {
    query = 'UPDATE artisans SET name=$1, specialty=$2, description=$3 WHERE id=$4 RETURNING *';
    params = [name, specialty, description, req.params.id];
  }
  const result = await pool.query(query, params);
  res.json(result.rows[0]);
});

app.delete('/api/artisans/:id', authenticate, requireAdmin, async (req, res) => {
  // Soft delete: oculta en lugar de borrar la foto física
  await pool.query('UPDATE artisans SET is_active = FALSE WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// ============================================================
//  ARTESANOS ANTERIORES (alumni)
// ============================================================
app.get('/api/alumni', async (req, res) => {
  const result = await pool.query('SELECT * FROM alumni ORDER BY year DESC');
  res.json(result.rows);
});

app.post('/api/alumni', authenticate, requireAdmin, upload.single('photo'), async (req, res) => {
  const { name, year, description } = req.body;
  const photo = req.file ? '/uploads/' + req.file.filename : (req.body.photo || '');
  const result = await pool.query(
    'INSERT INTO alumni (name, year, description, photo) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, year, description, photo]
  );
  res.json(result.rows[0]);
});

app.put('/api/alumni/:id', authenticate, requireAdmin, upload.single('photo'), async (req, res) => {
  const { name, year, description } = req.body;
  const photo = req.file ? '/uploads/' + req.file.filename : (req.body.photo || null);
  let query, params;
  if (photo) {
    query = 'UPDATE alumni SET name=$1, year=$2, description=$3, photo=$4 WHERE id=$5 RETURNING *';
    params = [name, year, description, photo, req.params.id];
  } else {
    query = 'UPDATE alumni SET name=$1, year=$2, description=$3 WHERE id=$4 RETURNING *';
    params = [name, year, description, req.params.id];
  }
  const result = await pool.query(query, params);
  res.json(result.rows[0]);
});

app.delete('/api/alumni/:id', authenticate, requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM alumni WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// ============================================================
//  GALERÍA
// ============================================================
app.get('/api/gallery', async (req, res) => {
  const result = await pool.query('SELECT * FROM gallery ORDER BY id DESC');
  res.json(result.rows);
});

app.post('/api/gallery', authenticate, requireAdmin, upload.single('image'), async (req, res) => {
  const { title } = req.body;
  const image = req.file ? '/uploads/' + req.file.filename : '';
  if (!image) return res.status(400).json({ error: 'Imagen requerida' });
  const result = await pool.query('INSERT INTO gallery (title, image) VALUES ($1,$2) RETURNING *', [title, image]);
  res.json(result.rows[0]);
});

app.delete('/api/gallery/:id', authenticate, requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM gallery WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// ============================================================
//  PORTAL DE ARTESANOS (protegido)
// ============================================================

// Próxima feria
app.get('/api/craft-fair', async (req, res) => {
  const result = await pool.query('SELECT * FROM craft_fair ORDER BY id DESC LIMIT 1');
  res.json(result.rows[0] || {});
});

app.put('/api/craft-fair/:id', authenticate, requireAdmin, async (req, res) => {
  const { title, event_date, event_time, location, map_url, description, requirements } = req.body;
  const result = await pool.query(
    `UPDATE craft_fair SET title=$1, event_date=$2, event_time=$3, location=$4,
     map_url=$5, description=$6, requirements=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
    [title, event_date, event_time, location, map_url, description, requirements, req.params.id]
  );
  res.json(result.rows[0]);
});

// Avisos de artesanos
app.get('/api/artisan-notices', async (req, res) => {
  const result = await pool.query('SELECT * FROM artisan_notices ORDER BY is_urgent DESC, published_at DESC');
  res.json(result.rows);
});

app.post('/api/artisan-notices', authenticate, requireAdmin, async (req, res) => {
  const { title, body, published_at, is_urgent } = req.body;
  const result = await pool.query(
    'INSERT INTO artisan_notices (title, body, published_at, is_urgent) VALUES ($1,$2,$3,$4) RETURNING *',
    [title, body, published_at || null, !!is_urgent]
  );
  res.json(result.rows[0]);
});

app.delete('/api/artisan-notices/:id', authenticate, requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM artisan_notices WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// Documentos
app.get('/api/documents', async (req, res) => {
  const result = await pool.query('SELECT * FROM documents ORDER BY id DESC');
  res.json(result.rows);
});

app.post('/api/documents', authenticate, requireAdmin, upload.single('file'), async (req, res) => {
  const { title } = req.body;
  const filename = req.file ? req.file.filename : '';
  if (!filename) return res.status(400).json({ error: 'Archivo requerido' });
  const result = await pool.query('INSERT INTO documents (title, filename) VALUES ($1,$2) RETURNING *', [title, filename]);
  res.json(result.rows[0]);
});

app.delete('/api/documents/:id', authenticate, requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM documents WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// Actividades (calendario)
app.get('/api/activities', async (req, res) => {
  const result = await pool.query('SELECT * FROM activities ORDER BY activity_date');
  res.json(result.rows);
});

app.post('/api/activities', authenticate, requireAdmin, async (req, res) => {
  const { title, activity_date, description } = req.body;
  const result = await pool.query(
    'INSERT INTO activities (title, activity_date, description) VALUES ($1,$2,$3) RETURNING *',
    [title, activity_date, description]
  );
  res.json(result.rows[0]);
});

app.delete('/api/activities/:id', authenticate, requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM activities WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// ============================================================
//  RUTAS HTML (páginas)
// ============================================================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/portal', (req, res) => res.sendFile(path.join(__dirname, 'portal.html')));
app.get('/portal.html', (req, res) => res.sendFile(path.join(__dirname, 'portal.html')));

// ============================================================
//  Arranque del servidor
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
  console.log(`    Público:  /`);
  console.log(`    Admin:    /admin   (usuario: ${process.env.ADMIN_USER || 'admin'})`);
  console.log(`    Portal:   /portal  (usuario: ${process.env.ARTISAN_USER || 'artesano'})`);
});
