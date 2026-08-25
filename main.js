
const $ = (sel) => document.querySelector(sel);
const api = (url, opts) => fetch(url, opts).then((r) => r.json());

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  $('#toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ---------- Modo oscuro ----------
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  $('#themeToggle').textContent = saved === 'dark' ? '☀️' : '🌙';
}
$('#themeToggle')?.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    $('#themeToggle').textContent = '🌙';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    $('#themeToggle').textContent = '☀️';
  }
});

// ---------- Menú móvil ----------
$('#menuToggle')?.addEventListener('click', () => {
  $('#navLinks').classList.toggle('open');
});

// ---------- Año del footer ----------
$('#year').textContent = new Date().getFullYear();

// ---------- Cargar ANUNCIOS ----------
async function loadAnnouncements() {
  const data = await api('/api/announcements');
  const grid = $('#announceGrid');
  if (!data.length) { grid.innerHTML = '<p>No hay anuncios por el momento.</p>'; return; }
  grid.innerHTML = data.map((a) => `
    <article class="announce-card ${a.is_urgent ? 'urgent' : ''}">
      ${a.is_urgent ? '<span class="badge">URGENTE</span>' : ''}
      <h3>${esc(a.title)}</h3>
      <p>${esc(a.body)}</p>
      <p class="date">📅 Publicado: ${a.published_at || ''}</p>
    </article>`).join('');
}

// ---------- Cargar INFO DEL PROGRAMA ----------
const ICONS = { history: '📜', objectives: '🎯', benefits: '🌟', activities: '🛠️' };
async function loadProgramInfo() {
  const data = await api('/api/program-info');
  const grid = $('#infoGrid');
  grid.innerHTML = data.map((i) => `
    <div class="info-card reveal">
      <div class="icon">${ICONS[i.section] || '✨'}</div>
      <h3>${esc(i.title)}</h3>
      <p>${esc(i.content)}</p>
    </div>`).join('');
  observeReveals();
}

// ---------- Cargar REQUISITOS ----------
async function loadRequirements() {
  const data = await api('/api/requirements');
  const labels = { documents: 'Documentos necesarios', criteria: 'Criterios de selección', dates: 'Fechas de inscripción' };
  const groups = {};
  data.forEach((r) => { (groups[r.category] = groups[r.category] || []).push(r); });
  const cols = $('#reqCols');
  cols.innerHTML = Object.keys(groups).map((cat) => `
    <div class="req-block reveal">
      <h3>${labels[cat] || cat}</h3>
      <ul>${groups[cat].map((r) => `<li><strong>${esc(r.title)}</strong>${r.description ? ' — ' + esc(r.description) : ''}</li>`).join('')}</ul>
    </div>`).join('');
  observeReveals();
}

// ---------- Cargar ARTESANOS ACTUALES ----------
let allArtisans = [];
async function loadArtisans() {
  allArtisans = await api('/api/artisans');
  renderArtisans(allArtisans);
}
function renderArtisans(list) {
  const grid = $('#artisansGrid');
  if (!list.length) { grid.innerHTML = '<p>No se encontraron artesanos.</p>'; return; }
  grid.innerHTML = list.map((a) => `
    <article class="art-card reveal">
      <img src="${esc(a.photo || 'https://via.placeholder.com/300?text=Artesano')}" alt="${esc(a.name)}" loading="lazy" />
      <div class="body">
        <span class="spec">${esc(a.specialty)}</span>
        <h3>${esc(a.name)}</h3>
        <p>${esc(a.description || '')}</p>
      </div>
    </article>`).join('');
  observeReveals();
}

// Buscador
$('#artisanSearch')?.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  renderArtisans(allArtisans.filter((a) =>
    a.name.toLowerCase().includes(q) || a.specialty.toLowerCase().includes(q)
  ));
});

// ---------- Cargar ARTESANOS ANTERIORES ----------
async function loadAlumni() {
  const data = await api('/api/alumni');
  const grid = $('#alumniGrid');
  grid.innerHTML = data.map((a) => `
    <article class="art-card reveal">
      <img src="${esc(a.photo || 'https://via.placeholder.com/300?text=Alumno')}" alt="${esc(a.name)}" loading="lazy" />
      <div class="body">
        <span class="spec">Clase ${a.year}</span>
        <h3>${esc(a.name)}</h3>
        <p>${esc(a.description || '')}</p>
      </div>
    </article>`).join('');
  observeReveals();
}

// ---------- Cargar GALERÍA ----------
async function loadGallery() {
  const data = await api('/api/gallery');
  const grid = $('#galleryGrid');
  grid.innerHTML = data.map((g) => `
    <figure class="reveal">
      <img src="${esc(g.image)}" alt="${esc(g.title || 'Galería')}" loading="lazy" />
      <figcaption>${esc(g.title || '')}</figcaption>
    </figure>`).join('');
  observeReveals();
}

// ---------- Animaciones reveal ----------
let observer;
function observeReveals() {
  if (!observer) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
  }
  document.querySelectorAll('.reveal:not(.visible)').forEach((el) => observer.observe(el));
}

// Escapar HTML (seguridad básica)
function esc(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- Init ----------
initTheme();
loadAnnouncements();
loadProgramInfo();
loadRequirements();
loadArtisans();
loadAlumni();
loadGallery();
