

const API = (url, opts) => fetch(url, {
  ...opts,
  headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
}).then((r) => r.json());

const $ = (s) => document.querySelector(s);
let token = localStorage.getItem('adminToken');

// ---------- Toast ----------
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  $('#toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ---------- Auth ----------
$('#loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const res = await API('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username: $('#username').value, password: $('#password').value }),
    });
    if (res.token && res.role === 'admin') {
      token = res.token;
      localStorage.setItem('adminToken', token);
      showPanel();
    } else {
      toast(res.error || 'Acceso denegado', 'error');
    }
  } catch (err) {
    console.error('Error en login:', err);
    toast('No se pudo conectar con el servidor / base de datos.', 'error');
  }
});

$('#logoutBtn')?.addEventListener('click', () => {
  token = null;
  localStorage.removeItem('adminToken');
  $('#adminView').classList.add('hidden');
  $('#loginView').classList.remove('hidden');
});

function authHeader() { return { headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } }; }

function showPanel() {
  $('#loginView').classList.add('hidden');
  $('#adminView').classList.remove('hidden');
  selectTab('announcements');
}

// ---------- Tabs ----------
const TABS = {
  announcements: { title: 'Anuncios', render: renderAnnouncements },
  programInfo: { title: 'Información del Programa', render: renderProgramInfo },
  requirements: { title: 'Requisitos', render: renderRequirements },
  artisans: { title: 'Artesanos Actuales', render: renderArtisans },
  alumni: { title: 'Artesanos Anteriores', render: renderAlumni },
  gallery: { title: 'Galería', render: renderGallery },
  fair: { title: 'Próxima Feria', render: renderFair },
  notices: { title: 'Avisos de Artesanos', render: renderNotices },
  documents: { title: 'Documentos', render: renderDocuments },
  activities: { title: 'Actividades (Calendario)', render: renderActivities },
};

document.querySelectorAll('.tab').forEach((t) =>
  t.addEventListener('click', () => selectTab(t.dataset.tab))
);

function selectTab(name) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  $('#tabTitle').textContent = TABS[name].title;
  // Solo algunas pestañas permiten "agregar"
  const addable = ['announcements', 'programInfo', 'requirements', 'artisans', 'alumni', 'gallery', 'notices', 'documents', 'activities'];
  $('#addBtn').style.display = addable.includes(name) ? 'inline-block' : 'none';
  $('#addBtn').onclick = () => openAdd(name);
  TABS[name].render();
}

// ---------- Helpers de modal ----------
function openModal(html) { $('#modalBody').innerHTML = html; $('#modal').classList.remove('hidden'); }
$('#modalClose')?.addEventListener('click', () => $('#modal').classList.add('hidden'));
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') $('#modal').classList.add('hidden'); });

function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// ---------- Render: Anuncios ----------
async function renderAnnouncements() {
  const data = await API('/api/announcements');
  $('#panel').innerHTML = data.map((a) => `
    <div class="list-item">
      <div>
        <h4>${esc(a.title)} ${a.is_urgent ? '⚠️' : ''}</h4>
        <p>${esc(a.body).slice(0, 80)}…</p>
        <span class="meta">📅 ${a.published_at || ''}</span>
      </div>
      <div class="list-actions">
        <button class="btn btn-gold btn-sm" onclick="editAnnouncement(${a.id})">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="del('/api/announcements', ${a.id}, renderAnnouncements)">Eliminar</button>
      </div>
    </div>`).join('') || '<p>No hay anuncios.</p>';
}
window.editAnnouncement = async (id) => {
  const data = await API('/api/announcements');
  const a = data.find((x) => x.id === id);
  openModal(`<h3>Editar Anuncio</h3>
    <label>Título</label><input id="f_title" value="${esc(a.title)}" />
    <label>Cuerpo</label><textarea id="f_body">${esc(a.body)}</textarea>
    <label>Fecha publicación</label><input type="date" id="f_date" value="${a.published_at || ''}" />
    <label><input type="checkbox" id="f_urgent" ${a.is_urgent ? 'checked' : ''} /> Urgente</label>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeM()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveAnnouncement(${id})">Guardar</button>
    </div>`);
};
window.saveAnnouncement = async (id) => {
  await fetch('/api/announcements/' + id, {
    ...authHeader(), method: 'PUT',
    body: JSON.stringify({ title: $('#f_title').value, body: $('#f_body').value, published_at: $('#f_date').value, is_urgent: $('#f_urgent').checked }),
  });
  closeM(); toast('Anuncio actualizado', 'success'); renderAnnouncements();
};
window.openAdd = function (tab) {
  if (tab === 'announcements') openModal(`<h3>Nuevo Anuncio</h3>
    <label>Título</label><input id="f_title" />
    <label>Cuerpo</label><textarea id="f_body"></textarea>
    <label>Fecha publicación</label><input type="date" id="f_date" />
    <label><input type="checkbox" id="f_urgent" /> Urgente</label>
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeM()">Cancelar</button>
    <button class="btn btn-primary" onclick="addAnnouncement()">Crear</button></div>`);
  if (tab === 'programInfo') openModal(`<h3>Nueva Información del Programa</h3>
    <label>Sección</label><select id="f_section"><option value="history">Historia</option><option value="objectives">Objetivos</option><option value="benefits">Beneficios</option><option value="activities">Actividades</option></select>
    <label>Título</label><input id="f_title" />
    <label>Contenido</label><textarea id="f_content"></textarea>
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeM()">Cancelar</button>
    <button class="btn btn-primary" onclick="addProgramInfo()">Crear</button></div>`);
  if (tab === 'requirements') openModal(`<h3>Nuevo Requisito</h3>
    <label>Categoría</label><select id="f_cat"><option value="documents">Documentos</option><option value="criteria">Criterios</option><option value="dates">Fechas</option></select>
    <label>Título</label><input id="f_title" />
    <label>Descripción</label><textarea id="f_desc"></textarea>
    <label>Orden</label><input type="number" id="f_order" value="0" />
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeM()">Cancelar</button>
    <button class="btn btn-primary" onclick="addRequirement()">Crear</button></div>`);
  if (tab === 'artisans') openModal(`<h3>Nuevo Artesano</h3>
    <label>Nombre</label><input id="f_name" />
    <label>Especialidad</label><input id="f_spec" />
    <label>Descripción</label><textarea id="f_desc"></textarea>
    <label>Foto (URL o subir)</label><input id="f_photo" placeholder="https://..." />
    <label>Subir imagen</label><input type="file" id="f_file" />
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeM()">Cancelar</button>
    <button class="btn btn-primary" onclick="addArtisan()">Crear</button></div>`);
  if (tab === 'alumni') openModal(`<h3>Nuevo Artesano Anterior</h3>
    <label>Nombre</label><input id="f_name" />
    <label>Año</label><input type="number" id="f_year" />
    <label>Descripción</label><textarea id="f_desc"></textarea>
    <label>Foto (URL)</label><input id="f_photo" placeholder="https://..." />
    <label>Subir imagen</label><input type="file" id="f_file" />
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeM()">Cancelar</button>
    <button class="btn btn-primary" onclick="addAlumni()">Crear</button></div>`);
  if (tab === 'gallery') openModal(`<h3>Nueva Foto</h3>
    <label>Título</label><input id="f_title" />
    <label>Imagen (URL)</label><input id="f_image_url" placeholder="https://..." />
    <label>Subir imagen</label><input type="file" id="f_file" />
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeM()">Cancelar</button>
    <button class="btn btn-primary" onclick="addGallery()">Guardar</button></div>`);
  if (tab === 'notices') openModal(`<h3>Nuevo Aviso</h3>
    <label>Título</label><input id="f_title" />
    <label>Cuerpo</label><textarea id="f_body"></textarea>
    <label>Fecha</label><input type="date" id="f_date" />
    <label><input type="checkbox" id="f_urgent" /> Urgente</label>
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeM()">Cancelar</button>
    <button class="btn btn-primary" onclick="addNotice()">Crear</button></div>`);
  if (tab === 'documents') openModal(`<h3>Nuevo Documento</h3>
    <label>Título</label><input id="f_title" />
    <label>Archivo</label><input type="file" id="f_file" required />
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeM()">Cancelar</button>
    <button class="btn btn-primary" onclick="addDocument()">Subir</button></div>`);
  if (tab === 'activities') openModal(`<h3>Nueva Actividad</h3>
    <label>Título</label><input id="f_title" />
    <label>Fecha</label><input type="date" id="f_date" />
    <label>Descripción</label><textarea id="f_desc"></textarea>
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeM()">Cancelar</button>
    <button class="btn btn-primary" onclick="addActivity()">Crear</button></div>`);
};

// Funciones de creación (POST con o sin archivo)
async function postForm(url, fields, fileField, fieldName) {
  const fd = new FormData();
  fields.forEach(([k, v]) => fd.append(k, v));
  if (fileField && $(fileField)?.files[0]) fd.append(fieldName || fileField, $(fileField).files[0]);
  return fetch(url, { ...authHeader(), method: 'POST', body: fd, headers: { 'Authorization': 'Bearer ' + token } }).then((r) => r.json());
}
window.addAnnouncement = async () => {
  await API('/api/announcements', { ...authHeader(), method: 'POST', body: JSON.stringify({ title: $('#f_title').value, body: $('#f_body').value, published_at: $('#f_date').value, is_urgent: $('#f_urgent').checked }) });
  closeM(); toast('Anuncio creado', 'success'); renderAnnouncements();
};
window.addProgramInfo = () => post('/api/program-info', { section: $('#f_section').value, title: $('#f_title').value, content: $('#f_content').value }, renderProgramInfo);
window.addRequirement = () => post('/api/requirements', { category: $('#f_cat').value, title: $('#f_title').value, description: $('#f_desc').value, sort_order: +$('#f_order').value }, renderRequirements);
window.addArtisan = async () => {
  const photo = $('#f_photo').value.trim();
  if (photo && !photo.startsWith('https://')) { toast('La URL de la foto debe comenzar con https://', 'error'); return; }
  await postForm('/api/artisans', [['name', $('#f_name').value], ['specialty', $('#f_spec').value], ['description', $('#f_desc').value], ['photo', photo]], '#f_file', 'photo');
  closeM(); toast('Artesano creado', 'success'); renderArtisans();
};
window.addAlumni = async () => {
  const photo = $('#f_photo').value.trim();
  if (photo && !photo.startsWith('https://')) { toast('La URL de la foto debe comenzar con https://', 'error'); return; }
  await postForm('/api/alumni', [['name', $('#f_name').value], ['year', $('#f_year').value], ['description', $('#f_desc').value], ['photo', photo]], '#f_file', 'photo');
  closeM(); toast('Artesano anterior creado', 'success'); renderAlumni();
};
window.addGallery = async () => {
  const url = $('#f_image_url').value.trim();
  const file = $('#f_file').files[0];
  if (!url && !file) { toast('Ingresa una URL o selecciona una imagen', 'error'); return; }
  if (url && !url.startsWith('https://')) { toast('La URL debe comenzar con https://', 'error'); return; }
  const fd = new FormData();
  fd.append('title', $('#f_title').value);
  if (url) fd.append('image', url);
  if (file) fd.append('image', file);
  const res = await fetch('/api/gallery', { headers: { 'Authorization': 'Bearer ' + token }, method: 'POST', body: fd });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Error desconocido' })); toast(err.error || 'Error al guardar', 'error'); return; }
  closeM(); toast('Foto guardada', 'success'); renderGallery();
};
window.addNotice = () => post('/api/artisan-notices', { title: $('#f_title').value, body: $('#f_body').value, published_at: $('#f_date').value, is_urgent: $('#f_urgent').checked }, renderNotices);
window.addDocument = async () => { await postForm('/api/documents', [['title', $('#f_title').value]], '#f_file'); closeM(); toast('Documento subido', 'success'); renderDocuments(); };
window.addActivity = () => post('/api/activities', { title: $('#f_title').value, activity_date: $('#f_date').value, description: $('#f_desc').value }, renderActivities);

async function post(url, body, after) {
  await API(url, { ...authHeader(), method: 'POST', body: JSON.stringify(body) });
  closeM(); toast('Guardado', 'success'); after();
}
window.del = async (url, id, after) => {
  if (!confirm('¿Eliminar este elemento?')) return;
  await fetch(url + '/' + id, { ...authHeader(), method: 'DELETE' });
  toast('Eliminado', 'success'); after();
};
window.closeM = () => $('#modal').classList.add('hidden');

// ---------- Render: Info Programa (edición inline) ----------
async function renderProgramInfo() {
  const data = await API('/api/program-info');
  $('#panel').innerHTML = data.map((i) => `
    <div class="list-item">
      <div><h4>${esc(i.title)} <small>(${i.section})</small></h4><p>${esc(i.content).slice(0,90)}…</p></div>
      <div class="list-actions">
        <button class="btn btn-gold btn-sm" onclick="editInfo(${i.id})">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="del('/api/program-info', ${i.id}, renderProgramInfo)">Eliminar</button>
      </div>
    </div>`).join('') || '<p>No hay información del programa.</p>';
}
window.editInfo = async (id) => {
  const data = await API('/api/program-info');
  const i = data.find((x) => x.id === id);
  openModal(`<h3>Editar: ${esc(i.title)}</h3>
    <label>Título</label><input id="f_title" value="${esc(i.title)}" />
    <label>Contenido</label><textarea id="f_content">${esc(i.content)}</textarea>
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeM()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveInfo(${id})">Guardar</button></div>`);
};
window.saveInfo = async (id) => {
  await API('/api/program-info/' + id, { ...authHeader(), method: 'PUT', body: JSON.stringify({ title: $('#f_title').value, content: $('#f_content').value }) });
  closeM(); toast('Actualizado', 'success'); renderProgramInfo();
};

// ---------- Render: Requisitos ----------
async function renderRequirements() {
  const data = await API('/api/requirements');
  $('#panel').innerHTML = data.map((r) => `
    <div class="list-item">
      <div><h4>${esc(r.title)} <small>(${r.category})</small></h4><p>${esc(r.description || '')}</p></div>
      <div class="list-actions">
        <button class="btn btn-gold btn-sm" onclick="editReq(${r.id})">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="del('/api/requirements', ${r.id}, renderRequirements)">Eliminar</button>
      </div>
    </div>`).join('') || '<p>No hay requisitos.</p>';
}
window.editReq = async (id) => {
  const data = await API('/api/requirements');
  const r = data.find((x) => x.id === id);
  openModal(`<h3>Editar Requisito</h3>
    <label>Categoría</label><select id="f_cat"><option ${r.category==='documents'?'selected':''}>documents</option><option ${r.category==='criteria'?'selected':''}>criteria</option><option ${r.category==='dates'?'selected':''}>dates</option></select>
    <label>Título</label><input id="f_title" value="${esc(r.title)}" />
    <label>Descripción</label><textarea id="f_desc">${esc(r.description || '')}</textarea>
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeM()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveReq(${id})">Guardar</button></div>`);
};
window.saveReq = async (id) => {
  await API('/api/requirements/' + id, { ...authHeader(), method: 'PUT', body: JSON.stringify({ category: $('#f_cat').value, title: $('#f_title').value, description: $('#f_desc').value, sort_order: 0 }) });
  closeM(); toast('Actualizado', 'success'); renderRequirements();
};

// ---------- Render: Artesanos ----------
async function renderArtisans() {
  const data = await API('/api/artisans');
  $('#panel').innerHTML = `<div class="cards">` + data.map((a) => `
    <div class="card">
      <img src="${esc(a.photo || 'https://via.placeholder.com/300')}" alt="${esc(a.name)}" />
      <div class="body"><h4>${esc(a.name)}</h4><p>${esc(a.specialty)}</p>
        <div class="list-actions" style="margin-top:0.5rem;">
          <button class="btn btn-gold btn-sm" onclick="editArtisan(${a.id})">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="del('/api/artisans', ${a.id}, renderArtisans)">Eliminar</button>
        </div>
      </div>
    </div>`).join('') + `</div>` || '<p>No hay artesanos.</p>';
}
window.editArtisan = async (id) => {
  const data = await API('/api/artisans');
  const a = data.find((x) => x.id === id);
  openModal(`<h3>Editar Artesano</h3>
    <label>Nombre</label><input id="f_name" value="${esc(a.name)}" />
    <label>Especialidad</label><input id="f_spec" value="${esc(a.specialty)}" />
    <label>Descripción</label><textarea id="f_desc">${esc(a.description || '')}</textarea>
    <label>Foto (URL)</label><input id="f_photo" value="${esc(a.photo)}" />
    <label>Cambiar imagen</label><input type="file" id="f_file" />
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeM()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveArtisan(${id})">Guardar</button></div>`);
};
window.saveArtisan = async (id) => {
  const fd = new FormData();
  fd.append('name', $('#f_name').value); fd.append('specialty', $('#f_spec').value); fd.append('description', $('#f_desc').value);
  const photoUrl = $('#f_photo').value.trim();
  if (photoUrl && !photoUrl.startsWith('https://')) { toast('La URL de la foto debe comenzar con https://', 'error'); return; }
  if (photoUrl) fd.append('photo', photoUrl);
  if ($('#f_file').files[0]) fd.append('photo', $('#f_file').files[0]);
  const res = await fetch('/api/artisans/' + id, { method: 'PUT', body: fd, headers: { 'Authorization': 'Bearer ' + token } });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Error desconocido' })); toast(err.error || 'Error al actualizar', 'error'); return; }
  closeM(); toast('Actualizado', 'success'); renderArtisans();
};

// ---------- Render: Alumni ----------
async function renderAlumni() {
  const data = await API('/api/alumni');
  $('#panel').innerHTML = `<div class="cards">` + data.map((a) => `
    <div class="card">
      <img src="${esc(a.photo || 'https://via.placeholder.com/300')}" alt="${esc(a.name)}" />
      <div class="body"><h4>${esc(a.name)}</h4><p>Año ${a.year}</p>
        <div class="list-actions" style="margin-top:0.5rem;">
          <button class="btn btn-gold btn-sm" onclick="editAlumni(${a.id})">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="del('/api/alumni', ${a.id}, renderAlumni)">Eliminar</button>
        </div>
      </div>
    </div>`).join('') + `</div>` || '<p>No hay registros.</p>';
}
window.editAlumni = async (id) => {
  const data = await API('/api/alumni');
  const a = data.find((x) => x.id === id);
  openModal(`<h3>Editar Anterior</h3>
    <label>Nombre</label><input id="f_name" value="${esc(a.name)}" />
    <label>Año</label><input type="number" id="f_year" value="${a.year}" />
    <label>Descripción</label><textarea id="f_desc">${esc(a.description || '')}</textarea>
    <label>Foto (URL)</label><input id="f_photo" value="${esc(a.photo)}" />
    <label>Cambiar imagen</label><input type="file" id="f_file" />
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeM()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveAlumni(${id})">Guardar</button></div>`);
};
window.saveAlumni = async (id) => {
  const fd = new FormData();
  fd.append('name', $('#f_name').value);
  fd.append('year', $('#f_year').value);
  fd.append('description', $('#f_desc').value);
  const photoUrl = $('#f_photo').value.trim();
  if (photoUrl && !photoUrl.startsWith('https://')) { toast('La URL de la foto debe comenzar con https://', 'error'); return; }
  if (photoUrl) fd.append('photo', photoUrl);
  if ($('#f_file').files[0]) fd.append('photo', $('#f_file').files[0]);
  const res = await fetch('/api/alumni/' + id, { method: 'PUT', body: fd, headers: { 'Authorization': 'Bearer ' + token } });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Error desconocido' })); toast(err.error || 'Error al actualizar', 'error'); return; }
  closeM(); toast('Actualizado', 'success'); renderAlumni();
};

// ---------- Render: Galería ----------
async function renderGallery() {
  const data = await API('/api/gallery');
  $('#panel').innerHTML = `<div class="cards">` + data.map((g) => `
    <div class="card"><img src="${esc(g.image)}" alt="${esc(g.title)}" />
      <div class="body"><h4>${esc(g.title || '')}</h4>
      <button class="btn btn-danger btn-sm" onclick="del('/api/gallery', ${g.id}, renderGallery)">Eliminar</button></div></div>`).join('') + `</div>`;
}

// ---------- Render: Feria (edición única) ----------
async function renderFair() {
  const f = await API('/api/craft-fair');
  $('#panel').innerHTML = `<div class="info-text">Información de la próxima feria de artesanías.</div>
    <div class="list-item"><div>
      <h4>${esc(f.title || 'Sin configurar')}</h4>
      <p>📅 ${f.event_date || ''} 🕒 ${f.event_time || ''}</p>
      <p>📍 ${esc(f.location || '')}</p>
    </div>
    <div class="list-actions"><button class="btn btn-gold btn-sm" onclick="editFair(${f.id})">Editar</button></div></div>`;
}
window.editFair = (id) => {
  // Recarga para tener valores actuales
  API('/api/craft-fair').then((f) => openModal(`<h3>Editar Feria</h3>
    <label>Título</label><input id="f_title" value="${esc(f.title)}" />
    <label>Fecha</label><input type="date" id="f_date" value="${f.event_date || ''}" />
    <label>Hora</label><input id="f_time" value="${esc(f.event_time)}" />
    <label>Lugar</label><input id="f_loc" value="${esc(f.location)}" />
    <label>Descripción</label><textarea id="f_desc">${esc(f.description)}</textarea>
    <label>Requisitos</label><textarea id="f_req">${esc(f.requirements)}</textarea>
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeM()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveFair(${id})">Guardar</button></div>`));
};
window.saveFair = async (id) => {
  await API('/api/craft-fair/' + id, { ...authHeader(), method: 'PUT', body: JSON.stringify({
    title: $('#f_title').value, event_date: $('#f_date').value, event_time: $('#f_time').value,
    location: $('#f_loc').value, description: $('#f_desc').value, requirements: $('#f_req').value
  }) });
  closeM(); toast('Feria actualizada', 'success'); renderFair();
};

// ---------- Render: Avisos artesanos ----------
async function renderNotices() {
  const data = await API('/api/artisan-notices');
  $('#panel').innerHTML = data.map((n) => `
    <div class="list-item"><div><h4>${esc(n.title)} ${n.is_urgent ? '⚠️' : ''}</h4><p>${esc(n.body).slice(0,80)}…</p>
      <span class="meta">📅 ${n.published_at || ''}</span></div>
      <div class="list-actions"><button class="btn btn-gold btn-sm" onclick="editNotice(${n.id})">Editar</button>
      <button class="btn btn-danger btn-sm" onclick="del('/api/artisan-notices', ${n.id}, renderNotices)">Eliminar</button></div></div>`).join('') || '<p>No hay avisos.</p>';
}
window.editNotice = async (id) => {
  const data = await API('/api/artisan-notices');
  const n = data.find((x) => x.id === id);
  openModal(`<h3>Editar Aviso</h3>
    <label>Título</label><input id="f_title" value="${esc(n.title)}" />
    <label>Cuerpo</label><textarea id="f_body">${esc(n.body)}</textarea>
    <label>Fecha</label><input type="date" id="f_date" value="${n.published_at || ''}" />
    <label><input type="checkbox" id="f_urgent" ${n.is_urgent ? 'checked' : ''} /> Urgente</label>
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeM()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveNotice(${id})">Guardar</button></div>`);
};
window.saveNotice = async (id) => {
  await API('/api/artisan-notices/' + id, { ...authHeader(), method: 'PUT', body: JSON.stringify({ title: $('#f_title').value, body: $('#f_body').value, published_at: $('#f_date').value, is_urgent: $('#f_urgent').checked }) });
  closeM(); toast('Aviso actualizado', 'success'); renderNotices();
};

// ---------- Render: Documentos ----------
async function renderDocuments() {
  const data = await API('/api/documents');
  $('#panel').innerHTML = data.map((d) => `
    <div class="list-item"><div><h4>${esc(d.title)}</h4><a href="/uploads/${esc(d.filename)}" target="_blank">📄 Ver/Descargar</a></div>
      <div class="list-actions"><button class="btn btn-danger btn-sm" onclick="del('/api/documents', ${d.id}, renderDocuments)">Eliminar</button></div></div>`).join('') || '<p>No hay documentos.</p>';
}

// ---------- Render: Actividades ----------
async function renderActivities() {
  const data = await API('/api/activities');
  $('#panel').innerHTML = data.map((a) => `
    <div class="list-item"><div><h4>${esc(a.title)}</h4><span class="meta">📅 ${a.activity_date || ''}</span><p>${esc(a.description || '')}</p></div>
      <div class="list-actions"><button class="btn btn-gold btn-sm" onclick="editActivity(${a.id})">Editar</button>
      <button class="btn btn-danger btn-sm" onclick="del('/api/activities', ${a.id}, renderActivities)">Eliminar</button></div></div>`).join('') || '<p>No hay actividades.</p>';
}
window.editActivity = async (id) => {
  const data = await API('/api/activities');
  const a = data.find((x) => x.id === id);
  openModal(`<h3>Editar Actividad</h3>
    <label>Título</label><input id="f_title" value="${esc(a.title)}" />
    <label>Fecha</label><input type="date" id="f_date" value="${a.activity_date || ''}" />
    <label>Descripción</label><textarea id="f_desc">${esc(a.description || '')}</textarea>
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeM()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveActivity(${id})">Guardar</button></div>`);
};
window.saveActivity = async (id) => {
  await API('/api/activities/' + id, { ...authHeader(), method: 'PUT', body: JSON.stringify({ title: $('#f_title').value, activity_date: $('#f_date').value, description: $('#f_desc').value }) });
  closeM(); toast('Actividad actualizada', 'success'); renderActivities();
};

// ---------- Init ----------
if (token) {
  // Verifica token válido
  API('/api/me', authHeader()).then((r) => {
    if (r.user && r.user.role === 'admin') showPanel();
    else { localStorage.removeItem('adminToken'); $('#loginView').classList.remove('hidden'); }
  }).catch(() => { $('#loginView').classList.remove('hidden'); });
} else {
  $('#loginView').classList.remove('hidden');
}
