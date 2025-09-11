let tasks = [];
const USE_API = true;
const API_BASE = location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : 'https://task-planner-api-af72.onrender.com/api';
const IS_PROD = location.hostname === 'web-lula.onrender.com';
let supervisors = []; 



const STATUS_UI2API = { 'Offen':'offen', 'Erledigt':'erledigt', 'In Arbeit':'in_arbeit', 'Review':'review' };
const STATUS_API2UI = { 'offen':'Offen', 'erledigt':'Erledigt', 'in_arbeit':'In Arbeit', 'review':'Review' };

function toViewModel(s){ // Server -> UI
  return {
    id: s._id,
    titel: s.title ?? '',
    beschreibung: s.description ?? '',
    zeit: s.effortMin ?? 0,
    verantwortlich: s.assignee ?? '',
    status: STATUS_API2UI[s.status] || 'Offen',
    comment: Array.isArray(s.comments) && s.comments[0]?.text ? s.comments[0].text : '',
    createdAt: s.createdAt, updatedAt: s.updatedAt
  };
}

function toApiModel(u){ // UI -> Server
  const title = (u.titel && String(u.titel).trim()) || 'Neuer Task'; // wichtig: nie leer
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



async function apiGetMe(){
  const r = await fetch(`${API_BASE}/auth/me`, { credentials:'include' });
  if (r.status === 401) return null;
  return r.json();
}
async function apiLogout(){
  await fetch(`${API_BASE}/auth/logout`, { method:'POST', credentials:'include' });
}

async function repoList(filter){
  if (!USE_API) return window.tasks || [];
  const qs = filter?.userId ? `?userId=${encodeURIComponent(filter.userId)}` : '';
  const r = await fetch(`${API_BASE}/tasks${qs}`, { credentials:'include' });
  return r.json();
}

async function repoCreate(task){
  if (!USE_API) return task;
  const r = await fetch(`${API_BASE}/tasks`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    credentials:'include', body: JSON.stringify(task)
  });
  return r.json();
}
async function repoPatch(id, patch){
  if (!USE_API) return patch;
  const r = await fetch(`${API_BASE}/tasks/${id}`, {
    method:'PATCH', headers:{'Content-Type':'application/json'},
    credentials:'include', body: JSON.stringify(patch)
  });
  return r.json();
}
async function repoDelete(id){
  if (!USE_API) return;
  await fetch(`${API_BASE}/tasks/${id}`, { method:'DELETE', credentials:'include' });
}

async function apiGetUsers(){
  const r = await fetch(`${API_BASE}/auth/users`, { credentials:'include' });
  if (!r.ok) return [];
  return r.json();
}

async function apiGetSupervisors(){
  const r = await fetch(`${API_BASE}/auth/supervisors`, { credentials:'include' });
  if (!r.ok) return [];
  return r.json();
}

let selectedTask = null;
let isEditing = false; 

let currentFilter = "Alle"; // Neu hinzugefügt

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

  document.querySelector(".task-info").innerHTML = `
    <h2><input type="text" value="${task.titel}" id="edit-titel" placeholder="Titel eingeben…" ${editable ? "" : "disabled"} /></h2>
    <p><strong>Beschreibung:</strong><br>
      <textarea id="edit-beschreibung" ${editable ? "" : "disabled"}>${task.beschreibung}</textarea>
    </p>
    <p><strong>Zeit Aufwand:</strong>
      <input type="text" value="${task.zeit}" id="edit-zeit" ${editable ? "" : "disabled"} />
    </p>
    <p><strong>Verantwortlicher:</strong>
      ${verantwortlicherControl}
    </p>
    <p><strong>Status:</strong>
      <input type="text" value="${task.status}" id="edit-status" disabled />
    </p>
  `;

  if (editable) {
    document.getElementById("edit-titel").addEventListener("input", e => {
      task.titel = e.target.value; renderTaskList();
    });
    document.getElementById("edit-beschreibung").addEventListener("input", e => task.beschreibung = e.target.value);
    document.getElementById("edit-zeit").addEventListener("input", e => task.zeit = e.target.value);
    document.getElementById("edit-verantwortlich").addEventListener("change", e => task.verantwortlich = e.target.value);
  }
}



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
        const saved = await repoPatch(task.id, toApiModel(patchUI)); // PATCH
        Object.assign(task, toViewModel(saved));
        renderTaskFields(task, false);
        renderTaskList();
      }
    };
  }

  if (statusButton) {
    statusButton.onclick = async () => {
      const next = task.status === 'Offen' ? 'Erledigt' : 'Offen';
      const saved = await repoPatch(task.id, { status: STATUS_UI2API[next] }); // PATCH nur Status
      Object.assign(task, toViewModel(saved));
      renderTaskFields(task, false);
      renderTaskList();
    };
  }

  if (deleteButton) {
    deleteButton.onclick = async () => {
      await repoDelete(task.id); // DELETE
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
  const created = await repoCreate(toApiModel(draft)); // POST
  const t = toViewModel(created);
  tasks.unshift(t);
  renderTaskList();
  isEditing = true;
  showTaskDetail(t);
}


function renderTaskFields(task, editable) {
  document.querySelector(".task-info").innerHTML = `
    <h2><input type="text" value="${task.titel}" id="edit-titel" placeholder="Titel eingeben…" ${editable ? "" : "disabled"} /></h2>
    <p><strong>Beschreibung:</strong><br>
      <textarea id="edit-beschreibung" ${editable ? "" : "disabled"}>${task.beschreibung}</textarea>
    </p>
    <p><strong>Zeit Aufwand:</strong>
      <input type="text" value="${task.zeit}" id="edit-zeit" ${editable ? "" : "disabled"} />
    </p>
    <p><strong>Verantwortlicher:</strong>
      <input type="text" value="${task.verantwortlich}" id="edit-verantwortlich" ${editable ? "" : "disabled"} />
    </p>
    <p><strong>Status:</strong>
      <input type="text" value="${task.status}" id="edit-status" disabled />
    </p>
  `;

  if (editable) {
    document.getElementById("edit-titel").addEventListener("input", e => {
      task.titel = e.target.value;
      renderTaskList();
    });
    document.getElementById("edit-beschreibung").addEventListener("input", e => task.beschreibung = e.target.value);
    document.getElementById("edit-zeit").addEventListener("input", e => task.zeit = e.target.value);
    document.getElementById("edit-verantwortlich").addEventListener("input", e => task.verantwortlich = e.target.value);
  }
}

async function ensureTopBar(me){
  const nav = document.querySelector('.navbar') || document.body;

  if (document.querySelector('.top-tools')) return; // schon vorhanden

  const holder = document.createElement('div');
  holder.className = 'top-tools';

  const info = document.createElement('span');
  info.className = 'top-tools__info';
  info.textContent = `${me.name || me.email} (${me.role})`;
  holder.appendChild(info);

  if (me.role === 'supervisor') {
    // User-Filter fuer Vorgesetzte (dein bestehender Code darf bleiben)
    const userSelect = document.createElement('select');
    userSelect.className = 'top-tools__select';
    const optAll = document.createElement('option');
    optAll.value = ''; optAll.textContent = 'Alle Benutzer';
    userSelect.appendChild(optAll);
    const users = await apiGetUsers(); // <- du hast diese Funktion bereits
    users.forEach(u => {
      const o = document.createElement('option');
      o.value = u.id;
      o.textContent = `${u.name} (${u.email})`;
      userSelect.appendChild(o);
    });
    userSelect.addEventListener('change', async () => {
      const userId = userSelect.value || null;
      const list = await repoList(userId ? { userId } : undefined);
      tasks = list.map(toViewModel);
      renderTaskList();
    });
    holder.appendChild(userSelect);
  }

  const logout = document.createElement('a');
  logout.href = '#';
  logout.id = 'logout-link';
  logout.className = 'top-tools__logout';
  logout.textContent = 'Logout';
  logout.addEventListener('click', async (e)=>{
    e.preventDefault();
    await apiLogout();
    location.href = './auth/login.html';
  });
  holder.appendChild(logout);

  nav.appendChild(holder);
}


document.addEventListener('DOMContentLoaded', async () => {
  if (IS_PROD) {
    const ov = document.getElementById('welcome-overlay');
    ov?.classList.add('is-open'); // Intro zeigen
    return; // Start erst per Button (hideWelcome)
  }
  await initApp(); // lokal direkt starten
});

let appReady = false;
let eventsBound = false;

async function initApp(){
  if (appReady) return;

  // Login-Check
  const me = await apiGetMe();
  if (!me) { location.href = './auth/login.html'; return; }

  // Supervisor-Liste fuer Dropdown laden
  try { supervisors = await apiGetSupervisors(); } catch { supervisors = []; }

  // Top-Bar (Userinfo + optionaler User-Filter + Logout)
  await ensureTopBar(me);

  // Tasks laden
  try {
    const serverTasks = await repoList(); // Supervisor: alle; User: nur eigene
    tasks = serverTasks.map(toViewModel);
  } catch (err) {
    console.error('Tasks laden fehlgeschlagen:', err);
    tasks = [];
  }

  // Events einmalig binden
  bindEventsOnce();

  // Erstes Rendern
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
  const asideToggleBtn = document.querySelector(".aside-action-button");
  asideToggleBtn?.addEventListener("click", () => {
    const aside = document.querySelector(".task-aside");
    if (!aside) return;
    const isHidden = aside.classList.toggle("hidden-mobile");
    asideToggleBtn.textContent = isHidden ? "Tasks anzeigen" : "Tasks verbergen";
  });

  eventsBound = true;
}

// Burger Menu Toggle
function toggleMenu() {
  const menu = document.getElementById("burger-menu");
  if (menu) {
    menu.classList.toggle("show");
  }
}


async function hideWelcome() {
  const me = await apiGetMe();
  if (!me) { location.href = './auth/login.html'; return; }

  await initApp();

  const overlay = document.getElementById('welcome-overlay');
  if (overlay){
    overlay.style.transition = 'opacity 0.4s ease';
    overlay.style.opacity = '0';
    setTimeout(()=>{ 
      overlay.classList.remove('is-open');
      overlay.style.display = 'none';
      overlay.style.opacity = '';
    }, 400);
  }
}
window.hideWelcome = hideWelcome;

document.addEventListener('click', (e) => {
  const btn = e.target.closest('#welcome-start-btn');
  if (!btn) return;
  e.preventDefault();
  hideWelcome();
});



