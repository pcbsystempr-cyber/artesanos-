// ============================================================
//  Portal de Artesanos - Lógica (protegido por sesión)
// ============================================================

const API = (url, opts) => fetch(url, {
  ...opts,
  headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
}).then((r) => {
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
});

const $ = (s) => document.querySelector(s);
let token = localStorage.getItem('artisanToken');

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  $('#toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function authHeader() { return { headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } }; }

// ---------- Login ----------
$('#loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const username = $('#username').value;
    const password = $('#password').value;
    console.log('Intentando login con usuario:', username);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    console.log('Login response status:', res.status);
    const data = await res.json().catch(() => ({}));
    console.log('Login response data:', data);
    if (res.ok && data.token) {
      token = data.token;
      localStorage.setItem('artisanToken', token);
      console.log('Login exitoso, token guardado');
      showPortal();
    } else {
      console.warn('Login fallido:', data.error || 'Sin token');
      toast(data.error || 'Acceso denegado', 'error');
    }
  } catch (err) {
    console.error('Error en login:', err);
    toast('No se pudo conectar con el servidor / base de datos.', 'error');
  }
});

$('#logoutBtn')?.addEventListener('click', () => {
  token = null; localStorage.removeItem('artisanToken');
  $('#portalView').classList.add('hidden');
  $('#loginView').classList.remove('hidden');
});

// ---------- Modo oscuro ----------
if (localStorage.getItem('ptheme') === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  const tg = document.querySelector('#themeToggle');
  if (tg) tg.textContent = '☀️';
}

$('#themeToggle')?.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('ptheme', 'light'); $('#themeToggle').textContent = '🌙'; }
  else { document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('ptheme', 'dark'); $('#themeToggle').textContent = '☀️'; }
});

function showPortal() {
  console.log('Mostrando portal...');
  if (localStorage.getItem('ptheme') === 'dark') { document.documentElement.setAttribute('data-theme', 'dark'); $('#themeToggle').textContent = '☀️'; }
  $('#loginView').classList.add('hidden');
  $('#portalView').classList.remove('hidden');
  console.log('Portal visible, cargando datos...');
  loadFair(); loadNotices(); loadDocuments(); loadCalendar();
}

// ---------- Cargar Feria ----------
async function loadFair() {
  try {
    const f = await API('/api/craft-fair');
    $('#fairContent').innerHTML = `
      <h3 class="fair-title">${esc(f.title || 'Por confirmar')}</h3>
      <p><strong>📅 Fecha:</strong> ${f.event_date || '—'}</p>
      <p><strong>🕒 Hora:</strong> ${esc(f.event_time || '—')}</p>
      <p><strong>📍 Lugar:</strong> ${esc(f.location || '—')}</p>
      <p style="margin-top:0.6rem;">${esc(f.description || '')}</p>
       <p style="margin-top:0.6rem;"><strong>Requisitos para participar:</strong> ${esc(f.requirements || '—')}</p>`;
  } catch (err) {
    console.error('Error cargando feria:', err);
    $('#fairContent').innerHTML = '<p class="error">No se pudo cargar la información de la feria.</p>';
  }
}

// ---------- Cargar Avisos ----------
async function loadNotices() {
  try {
    const data = await API('/api/artisan-notices');
    $('#notices').innerHTML = data.map((n) => `
      <div class="notice ${n.is_urgent ? 'urgent' : ''}">
        <strong>${esc(n.title)} ${n.is_urgent ? '⚠️' : ''}</strong>
        <p>${esc(n.body)}</p>
        <span class="date">📅 ${n.published_at || ''}</span>
      </div>`).join('') || '<p>No hay avisos.</p>';
  } catch (err) {
    console.error('Error cargando avisos:', err);
    $('#notices').innerHTML = '<p class="error">No se pudieron cargar los avisos.</p>';
  }
}

// ---------- Cargar Documentos ----------
async function loadDocuments() {
  try {
    const data = await API('/api/documents');
    $('#documents').innerHTML = data.map((d) => `<li><a href="/uploads/${esc(d.filename)}" target="_blank" download>📄 ${esc(d.title)}</a></li>`).join('') || '<li>No hay documentos.</li>';
  } catch (err) {
    console.error('Error cargando documentos:', err);
    $('#documents').innerHTML = '<li class="error">No se pudieron cargar los documentos.</li>';
  }
}

// ---------- Cargar Calendario ----------
async function loadCalendar() {
  try {
    const data = await API('/api/activities');
    $('#calendar').innerHTML = data.map((a) => `
      <div class="cal-item">
        <div class="date">📅 ${a.activity_date || ''}</div>
        <strong>${esc(a.title)}</strong>
        <p class="cal-desc">${esc(a.description || '')}</p>
      </div>`).join('') || '<p>Sin actividades programadas.</p>';
  } catch (err) {
    console.error('Error cargando calendario:', err);
    $('#calendar').innerHTML = '<p class="error">No se pudo cargar el calendario.</p>';
  }
}

// ---------- Init ----------
if (token) {
  fetch('/api/me', { ...authHeader() }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (r.ok && data.user) showPortal();
    else { localStorage.removeItem('artisanToken'); $('#loginView').classList.remove('hidden'); }
  }).catch(() => { $('#loginView').classList.remove('hidden'); });
} else {
  $('#loginView').classList.remove('hidden');
}
