// ====== Config & State ======
let tasks = [];
const USE_API = true;
const API_BASE = location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : 'https://task-planner-api-af72.onrender.com/api';
const IS_PROD = location.hostname === 'web-lula.onrender.com';
let supervisors = [];
let selectedTask = null;
let isEditing = false;
let currentFilter = 'Alle';
let appReady = false;
let eventsBound = false;

// ====== Status Mapping UI <-> API ======
const STATUS_UI2API = { 'Offen':'offen', 'Erledigt':'erledigt', 'In Arbeit':'in_arbeit', 'Review':'review' };
const STATUS_API2UI = { 'offen':'Offen', 'erledigt':'Erledigt', 'in_arbeit':'In Arbeit', 'review':'Review' };

// ====== Auth-Header (Bearer aus localStorage) ======
function authHeader(){
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ====== Model Mapper ======
function toViewModel(s){ // Server -> UI
  return {
    id: s._id,
    titel: s.title ?? '',
    beschreibung: s.description ?? '',
    zeit: s.effortMin ?? 0,
    verantwortlich: s.assignee ?? '',
    status: STATUS_API2UI[s.status] || 'Offen',
    comment: Array.isArray(s.comments) && s.comments[0]?.text ? s.comments[0].text : '',
    createdAt: s.createdAt,
    updatedAt: s.updatedAt
  };
}

function toApiModel(u){ // UI -> Server
  const title = (u.titel && String(u.titel).trim()) || 'Neuer Task';
  const body = {
    title,
    description: u.beschreibung ?? '',
    effortMin: Number(u.zeit) || 0,
    assignee: u.verantwortlich ?? '',
    status: STATUS_UI2API[u.status] || 'offen'
  };
  if (u.comment !== undefined) {
    body.comments = u.comment ? [{ text: String(u.comment) }] : [];
  }
  return body;
}

// ====== API Calls ======
async function apiGetMe(){
  const r = await fetch(`${API_BASE}/auth/me`, {
    credentials:'include',
    headers: { ...authHeader() }
  });
  if (r.status === 401) return null;
  return r.json();
}
async function apiLogout(){
  await fetch(`${API_BASE}/auth/logout`, {
    method:'POST', credentials:'include', headers: { ...authHeader() }
  });
  localStorage.removeItem('token');
}

async function apiGetUsers(){
  const r = await fetch(`${API_BASE}/auth/users`, {
    credentials:'include', headers:{ ...authHeader() }
  });
  if (!r.ok) return [];
  return r.json();
}
async function apiGetSupervisors(){
  const r = await fetch(`${API_BASE}/auth/supervisors`, {
    credentials:'include', headers:{ ...authHeader() }
  });
  if (!r.ok) return [];
  return r.json();
}

async function repoList(filter){
  if (!USE_API) return window.tasks || [];
  const qs = filter?.userId ? `?userId=${encodeURIComponent(filter.userId)}` : '';
  const r = await fetch(`${API_BASE}/tasks${qs}`, {
    credentials:'include', headers: { ...authHeader() }
  });
  return r.json();
}
async function repoCreate(task){
  if (!USE_API) return task;
  const r = await fetch(`${API_BASE}/tasks`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', ...authHeader() },
    credentials:'include',
    body: JSON.stringify(task)
  });
  return r.json();
}
async function repoPatch(id, patch){
  if (!USE_API) return patch;
  const r = await fetch(`${API_BASE}/tasks/${id}`, {
    method:'PATCH',
    headers:{ 'Content-Type':'application/json', ...authHeader() },
    credentials:'include',
    body: JSON.stringify(patch)
  });
  return r.json();
}
async function repoDelete(id){
  if (!USE_API) return;
  await fetch(`${API_BASE}/tasks/${id}`, {
    method:'DELETE', credentials:'include', headers:{ ...authHeader() }
  });
}

// ====== Rendering ======
function renderTaskList() {
  const taskList = document.getElementById('task-list');
  if (!taskList) return;

  taskList.innerHTML = '';

  const filtered = tasks.filter(t => {
    if (currentFilter === 'Offen') return t.status === 'Offen';
    if (currentFilter === 'Erledigt') return t.status === 'Erledigt';
    return true;
  });

  filtered.forEach(task => {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.textContent = `📝 ${task.titel || '(Unbenannter Task)'}`;
    card.dataset.id = task.id;
    card.addEventListener('click', () => showTaskDetail(task));
    if (selectedTask && selectedTask.id === task.id) card.classList.add('active');
    taskList.appendChild(card);
  });
}

function renderTaskFields(task, editable) {
  const verantwortlicherControl = editable
    ? `<select id="edit-verantwortlich" class="top-tools__select">
         ${['', ...supervisors.map(s => s.name)].map(name=>{
           const sel = (name === task.verantwortlich) ? 'selected' : '';
           const label = name ? name : '— auswaehlen —';
           const val = name || '';
           return `<option value="${val}" ${sel}>${label}</option>`;
         }).join('')}
       </select>`
    : `<span>${task.verantwortlich || '-'}</span>`;

  const html = `
    <h2>
      <input type="text" value="${task.titel}" id="edit-titel"
             placeholder="Titel eingeben…" ${editable ? '' : 'disabled'} />
    </h2>
    <p><strong>Beschreibung:</strong><br>
      <textarea id="edit-beschreibung" ${editable ? '' : 'disabled'}>${task.beschreibung}</textarea>
    </p>
    <p><strong>Zeit Aufwand:</strong>
      <input type="text" value="${task.zeit}" id="edit-zeit" ${editable ? '' : 'disabled'} />
    </p>
    <p><strong>Verantwortlicher:</strong>
      ${verantwortlicherControl}
    </p>
    <p><strong>Status:</strong>
      <input type="text" value="${task.status}" id="edit-status" disabled />
    </p>
  `;
  document.querySelector('.task-info').innerHTML = html;

  if (editable) {
    document.getElementById('edit-titel')?.addEventListener('input', e => {
      task.titel = e.target.value; renderTaskList();
    });
    document.getElementById('edit-beschreibung')?.addEventListener('input', e => task.beschreibung = e.target.value);
    document.getElementById('edit-zeit')?.addEventListener('input', e => task.zeit = e.target.value);
    document.getElementById('edit-verantwortlich')?.addEventListener('change', e => task.verantwortlich = e.target.value);
  }
}

// ====== UI Actions ======
async function showTaskDetail(task) {
  selectedTask = task;
  isEditing = false;

  renderTaskFields(task, false);

  const actionSection = document.querySelector('.task-actions');
  if (!actionSection) return;
  const buttons = actionSection.querySelectorAll('button');
  const editButton   = buttons[0];
  const statusButton = buttons[1];
  const deleteButton = buttons[2];

  if (editButton) {
    editButton.textContent = 'Editieren';
    editButton.onclick = async () => {
      isEditing = !isEditing;
      if (isEditing) {
        editButton.textContent = 'Speichern';
        renderTaskFields(task, true);
      } else {
        editButton.textContent = 'Editieren';
        const patchUI = {
          titel: document.getElementById('edit-titel')?.value ?? task.titel,
          beschreibung: document.getElementById('edit-beschreibung')?.value ?? task.beschreibung,
          zeit: document.getElementById('edit-zeit')?.value ?? task.zeit,
          verantwortlich: document.getElementById('edit-verantwortlich')?.value ?? task.verantwortlich,
          status: task.status,
          comment: task.comment || ''
        };
        const saved = await repoPatch(task.id, toApiModel(patchUI));
        Object.assign(task, toViewModel(saved));
        renderTaskFields(task, false);
        renderTaskList();
      }
    };
  }

  if (statusButton) {
    statusButton.onclick = async () => {
      const next = task.status === 'Offen' ? 'Erledigt' : 'Offen';
      const saved = await repoPatch(task.id, { status: STATUS_UI2API[next] });
      Object.assign(task, toViewModel(saved));
      renderTaskFields(task, false);
      renderTaskList();
    };
  }

  if (deleteButton) {
    deleteButton.onclick = async () => {
      await repoDelete(task.id);
      const idx = tasks.findIndex(t => t.id === task.id);
      if (idx !== -1) tasks.splice(idx, 1);
      selectedTask = null;
      renderTaskList();
      const info = document.querySelector('.task-info');
      if (info) info.innerHTML = '<h2>[Kein Task ausgewaehlt]</h2>';
    };
  }

  const textarea = document.querySelector('.task-comment textarea');
  if (textarea) {
    textarea.value = task.comment || '';
    textarea.oninput = (e) => { task.comment = e.target.value; };
    textarea.onchange = async (e) => {
      const saved = await repoPatch(task.id, {
        comments: e.target.value ? [{ text: e.target.value }] : []
      });
      Object.assign(task, toViewModel(saved));
    };
  }
}

async function createNewTask() {
  const draft = {
    titel: 'Neuer Task', beschreibung: '', zeit: 0,
    verantwortlich: '', status: 'Offen', comment: ''
  };
  const created = await repoCreate(toApiModel(draft));
  const t = toViewModel(created);
  tasks.unshift(t);
  renderTaskList();
  isEditing = true;
  showTaskDetail(t);
}

async function ensureTopBar(me){
  // 1) Logout-Icon klicken -> ausloggen
  const logout = document.getElementById('logout-link');
  if (logout && !logout._bound){
    logout.addEventListener('click', async (e)=>{
      e.preventDefault();
      await apiLogout();
      location.href = './auth/login.html';
    });
    logout._bound = true;
  }

  // 2) User-Badge unter den Buttons anzeigen
  const actions = document.querySelector('.navbar-actions');
  if (!actions) return;

  let badge = document.querySelector('.user-badge');
  if (!badge){
    badge = document.createElement('div');
    badge.className = 'user-badge';
    actions.appendChild(badge);
  }
  badge.textContent = `${me.name || me.email} (${me.role})`;
}


// ====== App Start ======
document.addEventListener('DOMContentLoaded', async () => {
  if (IS_PROD) {
    document.getElementById('welcome-overlay')?.classList.add('is-open');
    return; // Start nur per Button
  }
  await initApp(); // lokal direkt
});

async function initApp(){
  if (appReady) return;

  const me = await apiGetMe();
  if (!me) { location.href = './auth/login.html'; return; }

  try { supervisors = await apiGetSupervisors(); } catch { supervisors = []; }
  await ensureTopBar(me);

  try {
    const serverTasks = await repoList();
    tasks = serverTasks.map(toViewModel);
  } catch (err) {
    console.error('Tasks laden fehlgeschlagen:', err);
    tasks = [];
  }

  bindEventsOnce();
  renderTaskList();

  appReady = true;
}

function bindEventsOnce(){
  if (eventsBound) return;

  document.getElementById('new-task-button')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await createNewTask();
  });

  document.getElementById('show-open-tasks')?.addEventListener('click', (e) => {
    e.preventDefault(); currentFilter = 'Offen'; renderTaskList();
  });

  document.getElementById('show-done-tasks')?.addEventListener('click', (e) => {
    e.preventDefault(); currentFilter = 'Erledigt'; renderTaskList();
  });

  // Mobile Aside Toggle
  const asideToggleBtn = document.querySelector('.aside-action-button');
  asideToggleBtn?.addEventListener('click', () => {
    const aside = document.querySelector('.task-aside');
    if (!aside) return;
    const isHidden = aside.classList.toggle('hidden-mobile');
    asideToggleBtn.textContent = isHidden ? 'Tasks anzeigen' : 'Tasks verbergen';
  });

  eventsBound = true;
}

// ====== UI Helpers ======
function toggleMenu() {
  const menu = document.getElementById('burger-menu');
  menu?.classList.toggle('show');
}

// ====== Overlay Button ======
async function hideWelcome() {
  console.log('[overlay] hideWelcome clicked');

  const me = await apiGetMe();
  if (!me) {
    location.href = './auth/login.html';
    return;
  }

  await initApp();

  const overlay = document.getElementById('welcome-overlay');
  if (overlay) {
    overlay.style.transition = 'opacity 0.4s ease';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.classList.remove('is-open');
      overlay.style.display = 'none';
      overlay.style.opacity = '';
      // Merker setzen: Overlay wurde schon einmal geschlossen
      localStorage.setItem("welcomeSeen", "1");
    }, 400);
  }
}
window.hideWelcome = hideWelcome; // fuer onclick im HTML

// Fallback: Event Delegation falls onclick entfernt wird
document.addEventListener('click', (e) => {
  const btn = e.target.closest('#welcome-start-btn');
  if (!btn) return;
  e.preventDefault();
  hideWelcome();
});

// ====== Overlay beim Laden prüfen ======
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("welcome-overlay");
  if (!overlay) return;

  // Eingeloggte User -> Overlay gar nicht zeigen
  if (localStorage.getItem("token")) {
    overlay.style.display = "none";
    return;
  }

  // Falls schon einmal weggeblendet -> nicht mehr anzeigen
  if (localStorage.getItem("welcomeSeen")) {
    overlay.style.display = "none";
  }
});
