let tasks = [];
const USE_API = true;
const API_BASE = 'http://localhost:3001/api';

const STATUS_UI2API = { 'Offen':'offen', 'Erledigt':'erledigt', 'In Arbeit':'in_arbeit', 'Review':'review' };
const STATUS_API2UI = { 'offen':'Offen', 'erledigt':'Erledigt', 'in_arbeit':'In Arbeit', 'review':'Review' };

function toViewModel(s){ // Server -> UI
  return {
    id: s._id,
    titel: s.title ?? '',
    beschreibung: s.description ?? '',
    zeit: s.effortMin ?? 0,
    verantwortlich: s.assignee ?? '',
    auditor: s.auditor ?? '',
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
    auditor: u.auditor ?? '',
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

let selectedTask = null;
let isEditing = false; 

let currentFilter = "Alle"; // Neu hinzugefügt

function renderTaskList() {
  const taskList = document.getElementById("task-list");
  taskList.innerHTML = "";

  const filteredTasks = tasks.filter(task => {
    if (currentFilter === "Offen") return task.status === "Offen";
    if (currentFilter === "Erledigt") return task.status === "Erledigt";
    return true; // "Alle"
  });

  filteredTasks.forEach(task => {
    const card = document.createElement("div");
    card.className = "task-card";
    card.textContent = `📝 ${task.titel || "(Unbenannter Task)"}`;
    card.dataset.id = task.id;

    card.addEventListener("click", () => {
      showTaskDetail(task);
    });

    if (selectedTask && selectedTask.id === task.id) {
      card.classList.add("active");
    }

    taskList.appendChild(card);
  });
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
          auditor: document.getElementById('edit-auditor')?.value ?? task.auditor,
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
    verantwortlich: '', auditor: '', status: 'Offen', comment: ''
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
    <p><strong>Auditor:</strong>
      <input type="text" value="${task.auditor}" id="edit-auditor" ${editable ? "" : "disabled"} />
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
    document.getElementById("edit-auditor").addEventListener("input", e => task.auditor = e.target.value);
  }
}

async function ensureTopBar(me){
  const nav = document.querySelector('.navbar') || document.body;

  // Container rechts
  const holder = document.createElement('div');
  holder.id = 'top-tools';
  holder.style.marginLeft = 'auto';
  holder.style.display = 'flex';
  holder.style.gap = '8px';
  holder.style.alignItems = 'center';

  // Anzeige "Angemeldet als"
  const info = document.createElement('span');
  info.style.opacity = '0.8';
  info.textContent = `${me.name || me.email} (${me.role})`;
  holder.appendChild(info);

  // Wenn Vorgesetzter: User-Select einblenden
  let userSelect = null;
  if (me.role === 'supervisor') {
    userSelect = document.createElement('select');
    userSelect.id = 'user-filter';
    const optAll = document.createElement('option');
    optAll.value = '';
    optAll.textContent = 'Alle Benutzer';
    userSelect.appendChild(optAll);

    const users = await apiGetUsers();
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

  // Logout
  const logout = document.createElement('a');
  logout.href = '#';
  logout.id = 'logout-link';
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
  const me = await apiGetMe();
  if (!me) { location.href = './auth/login.html'; return; }

  // NEU: Top-Bar (Userinfo + optionaler User-Filter + Logout)
  await ensureTopBar(me);

  // Tasks laden
  try {
    const serverTasks = await repoList(); // Supervisor: alle; User: nur eigene
    tasks = serverTasks.map(toViewModel);
  } catch (err) {
    console.error('Tasks laden fehlgeschlagen:', err);
    tasks = [];
  }

  // Events
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

  // Initial render
  renderTaskList();

  // Button Listener für Burger Menu
const asideToggleBtn = document.querySelector(".aside-action-button");
if (asideToggleBtn) {
  asideToggleBtn.addEventListener("click", () => {
    const aside = document.querySelector(".task-aside");
    if (!aside) return;

    const isHidden = aside.classList.toggle("hidden-mobile");
    asideToggleBtn.textContent = isHidden ? "Tasks anzeigen" : "Tasks verbergen";
  });
}


});




// Burger Menu Toggle
function toggleMenu() {
  const menu = document.getElementById("burger-menu");
  if (menu) {
    menu.classList.toggle("show");
  }
}


function hideWelcome() {
    const overlay = document.getElementById("welcome-overlay");
    overlay.style.transition = "opacity 0.4s ease";
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.style.display = "none";
    }, 400);
  }