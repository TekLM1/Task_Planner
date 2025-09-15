# 📝 Task Planner für Lernende

Ein einfacher webbasierten Task-Manager, der speziell für Lernende entwickelt wurde.  
Er hilft dabei, Aufgaben zu erstellen, zu organisieren, zu dokumentieren und den Fortschritt zu überwachen.  
Das Projekt besteht aus **Frontend (HTML, CSS, JS)** und einem **Backend (Node.js, Express, MongoDB)**.  

---

## 🚀 Features

- 📋 Aufgaben erstellen, bearbeiten und löschen  
- ✅ Status ändern (Offen / In Arbeit / Review / Erledigt)  
- 🧑 Verantwortliche und Auditoren zuweisen  
- 💬 Kommentare zu einzelnen Tasks hinzufügen  
- 📱 Responsive Design mit mobiler Navigation  
- 🎨 Dunkles Theme mit CSS-Variablen  
- 🔐 Authentifizierung mit JWT-Cookies (Login / Logout)  
- 👥 Rollen-System: **User** und **Supervisor**  
- 🌐 REST-API für Aufgaben und Benutzerverwaltung  

---

## 🛠️ Technologien

### Frontend
- **HTML5**
- **CSS3** (inkl. CSS-Variablen & Modularisierung)
- **JavaScript (Vanilla)**
- Keine externen Frameworks oder Libraries notwendig

### Backend
- **Node.js / Express**
- **MongoDB Atlas (Mongoose)**
- **JWT** für Authentifizierung
- **bcryptjs** für Passwort-Hashing
- **cookie-parser** & **CORS**

---

## ⚙️ Installation & Setup

### Voraussetzungen
- Node.js >= 18
- npm oder yarn
- MongoDB Atlas oder lokale Instanz

### Backend starten
1. Repo clonen oder herunterladen  
2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
3. `.env` Datei anlegen (siehe Beispiel unten)  
4. Starten:
   ```bash
   # Entwicklung mit Hot Reload
   npm run dev

   # Produktion
   npm start
   ```

API läuft standardmäßig auf `http://localhost:3001`.

---

## 🔑 .env Beispiel

```env
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster-url/dbname
CORS_ORIGIN=https://web-lula.onrender.com
JWT_SECRET=geheimes-passwort
NODE_ENV=production
```

---

## 📡 API Endpunkte

### Healthcheck
`GET /api/health` → `{ "ok": true }`

### Auth
- `POST /api/auth/register` – Benutzer registrieren
- `POST /api/auth/login` – Login, setzt JWT-Cookie
- `POST /api/auth/logout` – Logout, löscht Cookie
- `GET /api/auth/me` – Infos zum eingeloggten User

### Benutzer (nur Supervisor)
- `GET /api/auth/users` – Liste aller User
- `GET /api/auth/supervisors` – Liste aller Supervisoren

### Tasks
- `GET /api/tasks` – Alle Tasks (oder nur eigene, falls User)
- `POST /api/tasks` – Neuen Task erstellen
- `PATCH /api/tasks/:id` – Task bearbeiten
- `DELETE /api/tasks/:id` – Task löschen

---

## 💻 Frontend Nutzung

### Lokale Ausführung
1. Projekt lokal klonen oder herunterladen.
2. `index.html` im Browser öffnen.
3. Interaktiv Aufgaben erstellen und bearbeiten.

### Aufgaben erstellen
Klicke auf den Button **„Neuer Task ➕“** in der Navigation.  
Fülle danach die Eingabefelder im Detailbereich aus.

### Mobiles Layout
Nutze den **„☰ Burger-Menü“-Button**, um zwischen Aufgabenansichten zu wechseln.  
Die Seitenleiste kann auf Mobilgeräten mit dem Button **„Tasks anzeigen“** ein- und ausgeblendet werden.

---

## 📂 Ordnerstruktur

```
project/
│── models/       → Mongoose Modelle (User, Task)
│── routes/       → Express Routen (auth, tasks)
│── middleware/   → Middleware (auth check)
│── frontend/     → HTML, CSS, JS Dateien
│── .env          → Konfiguration
│── server.js     → Startpunkt der App
```

---

## 👤 Autoren

- Erstellt von Lernenden im Rahmen eines Projekts bei  
- Lars Stocker & Luca Messina  
  **Teko Olten**  
- Kontakt: _Do not contact us 😄_  

© Teko LULA – Semesterarbeit
