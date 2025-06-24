const tasks = [];
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

function showTaskDetail(task) {
  selectedTask = task;
  isEditing = false;

  const infoSection = document.querySelector(".task-info");
  const [editButton, statusButton, deleteButton] = document.querySelectorAll(".task-actions button");

  renderTaskFields(task, false); // zuerst Felder NICHT bearbeitbar

  editButton.textContent = "Editieren";

  editButton.onclick = () => {
    isEditing = !isEditing;

    if (isEditing) {
      editButton.textContent = "Speichern";
    } else {
      editButton.textContent = "Editieren";
    }

    renderTaskFields(task, isEditing); // Felder sperren oder freischalten
    renderTaskList(); // Liste neu laden
  };

  statusButton.onclick = () => {
    task.status = task.status === "Offen" ? "Erledigt" : "Offen";
    if (!isEditing) renderTaskFields(task, false);
    renderTaskList();
  };

  deleteButton.onclick = () => {
    const index = tasks.findIndex(t => t.id === task.id);
    if (index !== -1) {
      tasks.splice(index, 1);
      selectedTask = null;
      renderTaskList();
      document.querySelector(".task-info").innerHTML = "<h2>[Kein Task ausgewählt]</h2>";
    }
  };

  const textarea = document.querySelector(".task-comment textarea");
  textarea.value = task.comment || "";
  textarea.oninput = e => {
    task.comment = e.target.value;
  };
}

function createNewTask() {
  const newTask = {
    id: Date.now(),
    titel: "",
    beschreibung: "",
    zeit: "",
    verantwortlich: "",
    auditor: "",
    status: "Offen",
    comment: ""
  };
  tasks.push(newTask);
  renderTaskList();
  isEditing = true;
  showTaskDetail(newTask);
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

// Initialisierung nach Laden der Seite
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("new-task-button").addEventListener("click", e => {
    e.preventDefault();
    createNewTask();
  });

  renderTaskList();
    document.getElementById("show-open-tasks").addEventListener("click", e => {
    e.preventDefault();
    currentFilter = "Offen";
    renderTaskList();
  });

  document.getElementById("show-done-tasks").addEventListener("click", e => {
    e.preventDefault();
    currentFilter = "Erledigt";
    renderTaskList();
  });
});

// Burger Menu Toggle
function toggleMenu() {
  const menu = document.getElementById("burger-menu");
  if (menu) {
    menu.classList.toggle("show");
  }
}

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






/*
class Note {
  constructor(id, text) {
    this.id = id;
    this.text = text;
  }

  static fromJSON(json) {
    return new Note(json.id, json.text);
  }

  toJSON() {
    return { id: this.id, text: this.text };
  }
}

class StorageService {
  constructor(key) {
    this.key = key;
    this.items = this._getStoredItems();
  }

  _setStoredItems(items) {
    localStorage.setItem(this.key, JSON.stringify(items));
  }

  _getStoredItems() {
    return JSON.parse(localStorage.getItem(this.key)) || [];
  }

  create(item) {
    const newItem = { id: Date.now(), ...item };
    this.items.push(newItem);
    this._setStoredItems(this.items);
    return newItem;
  }

  get() {
    return this.items;
  }

  update(updatedItem) {
    const index = this.items.findIndex((item) => item.id === updatedItem.id);
    if (index !== -1) {
      Object.assign(this.items[index], updatedItem);
      this._setStoredItems(this.items);
      return { ...updatedItem };
    }
    console.warn("Item does not exist");
    return null;
  }

  delete(id) {
    const index = this.items.findIndex((item) => item.id === id);
    if (index !== -1) {
      const [deletedItem] = this.items.splice(index, 1);
      this._setStoredItems(this.items);
      return deletedItem;
    }
    console.warn("Item does not exist");
    return null;
  }

  deleteAll() {
    this.items = [];
    localStorage.removeItem(this.key);
    console.info(`All items deleted from ${this.key}`);
  }
}

class ModalService {
  constructor(createCallback, updateCallback) {
    this.createCallback = createCallback;
    this.updateCallback = updateCallback;
    this.item = {};
  }

  initialize() {
    this.modalElement = document.querySelector(".modal");
    this.modal = new bootstrap.Modal(this.modalElement);
    this.textarea = this.modalElement.querySelector("textarea");
    this.saveBtn = this.modalElement.querySelector(".btn-primary");
    this.floatingActionButton = document.querySelector(
      ".floating-action-button"
    );
    this.staticActionButton = document.querySelector(".static-action-button");

    this._initializeEventListeners();
  }

  _initializeEventListeners() {
    this.modalElement.addEventListener("shown.bs.modal", () =>
      this.textarea.focus()
    );
    this.saveBtn.addEventListener("click", () => this._handleSave());
    this.floatingActionButton.addEventListener("click", (event) => {
      event.preventDefault();
      this.openModal();
    });
    this.staticActionButton.addEventListener("click", (event) => {
      event.preventDefault();
      this.openModal();
    });
  }

  async _handleSave() {
    const text = this.textarea.value.trim();
    if (!text) return;

    this.item.text = text;
    this.item.id
      ? await this.updateCallback(this.item)
      : await this.createCallback(this.item);
    this.item = {};
    this.closeModal();
  }

  openModal() {
    this.textarea.value = this.item.text || "";
    this.modal.show();
  }

  closeModal() {
    this.modal.hide();
  }
}

class NotesRenderService {
  renderNotes(notes, container, onEdit, onDelete) {
    container.innerHTML = "";
    notes.forEach((note) => {
      const card = document.createElement("div");
      card.innerHTML = this._renderNoteCard(note);
      container.appendChild(card);
      this._attachNoteButtonEvents(note, onEdit, onDelete);
    });
  }

  _renderNoteCard(note) {
    return `<div id="note-${note.id}" class="card">
          <div class="card-body">
            <div class="card-text">${note.text}</div>
          </div>
          <div class="card-actions" id="card-actions-${note.id}">
            <button class="btn btn-primary"><i class="fa-solid fa-edit"></i></button>
            <button class="btn btn-secondary"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`;
  }

  _attachNoteButtonEvents(note, onEdit, onDelete) {
    const cardActions = document.getElementById(`card-actions-${note.id}`);
    if (!cardActions) return;

    cardActions
      .querySelector(".btn-primary")
      .addEventListener("click", (event) => {
        event.preventDefault();
        onEdit(note);
      });

    cardActions
      .querySelector(".btn-secondary")
      .addEventListener("click", (event) => {
        event.preventDefault();
        onDelete(note);
      });
  }
}

// Initialization
const initialize = () => {
  const storageService = new StorageService("note");
  const modalService = new ModalService(createCallback, updateCallback);
  modalService.initialize();

  function renderNotes() {
    const container = document.querySelector("main");
    const notesRenderService = new NotesRenderService();
    notesRenderService.renderNotes(
      storageService.get().sort((a, b) => b.id - a.id),
      container,
      onEdit,
      onDelete
    );
  }

  function createCallback(note) {
    storageService.create(note);
    renderNotes();
  }

  function updateCallback(note) {
    storageService.update(note);
    renderNotes();
  }

  function onEdit(item) {
    modalService.item = item;
    modalService.openModal();
  }

  function onDelete(item) {
    storageService.delete(item.id);
    renderNotes();
  }

  renderNotes();
};

initialize();

class HttpService {
  constructor(
    apiBaseUrl,
    defaultHeaders = { "Content-Type": "application/json" }
  ) {
    this.apiBaseUrl = apiBaseUrl;
    this.defaultHeaders = defaultHeaders;
  }

  async request(endpoint, method = "GET", body = null, headers = {}) {
    const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
      method,
      headers: { ...this.defaultHeaders, ...headers },
      body: body ? JSON.stringify(body) : null,
    });

    return this.handleResponse(response);
  }

  async get(endpoint) {
    return this.request(endpoint, "GET");
  }

  async getById(endpoint, id) {
    return this.get(`${endpoint}/${id}`);
  }

  async post(endpoint, data) {
    return this.request(endpoint, "POST", data);
  }

  async put(endpoint, id, data) {
    return this.request(`${endpoint}/${id}`, "PUT", data);
  }

  async delete(endpoint, id) {
    return this.request(`${endpoint}/${id}`, "DELETE");
  }

  async handleResponse(response) {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  }
}

const testHttp = () => {
  const api = new HttpService("https://jsonplaceholder.typicode.com");

  // Get all data
  api
    .get("/posts")
    .then((data) => console.log("GET all:", data))
    .catch((error) => console.error("GET Error:", error));

  // Get single item by ID (/data/1)
  api
    .getById("/posts", 1)
    .then((data) => console.log("GET by ID:", data))
    .catch((error) => console.error("GET by ID Error:", error));

  // Update item (/data/1)
  api
    .put("/posts", 1, { name: "Updated Name" })
    .then((data) => console.log("PUT Success:", data))
    .catch((error) => console.error("PUT Error:", error));

  // Delete item (/data/1)
  api
    .delete("/posts", 1)
    .then(() => console.log("DELETE Success"))
    .catch((error) => console.error("DELETE Error:", error));
};

testHttp();
*/