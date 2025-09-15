// API-Basis: lokal oder Deployment-URL
const API =
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3001/api'
    : 'https://task-planner-api-af72.onrender.com/api';

// Hilfsfunktion: Authorization-Header mit JWT aus localStorage
function authHeader(){
  const t = localStorage.getItem('token');
  return t ? { 'Authorization': 'Bearer ' + t } : {};
}

// Nach DOM-Load: Login- und Register-Formulare binden
document.addEventListener('DOMContentLoaded', ()=>{
  const lf = document.getElementById('login-form');
  if (lf) lf.addEventListener('submit', onLogin);

  const rf = document.getElementById('reg-form');
  if (rf) rf.addEventListener('submit', onRegister);
});

// Hilfsfunktion: POST-Requests (Login/Register)
async function post(path, data){
  const r = await fetch(API + path, {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    credentials:'include',        // Cookies mitschicken (falls gesetzt)
    body: JSON.stringify(data)
  });
  const json = await r.json().catch(()=> ({}));

  // Fehlerfall: Exception mit Fehlermeldung
  if (!r.ok) throw new Error(json.error || 'Fehler');

  // Token im localStorage sichern (wenn vorhanden)
  if (json.token) localStorage.setItem('token', json.token);

  return json;
}

// Login-Handler: Formulardaten sammeln und an /auth/login senden
async function onLogin(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  await post('/auth/login', { 
    email: fd.get('email'), 
    password: fd.get('password') 
  });
  location.href = '../index.html';   // nach Login zur Startseite
}

// Register-Handler: Formulardaten sammeln und an /auth/register senden
async function onRegister(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  await post('/auth/register', {
    name: fd.get('name'),
    email: fd.get('email'),
    password: fd.get('password'),
    role: fd.get('role')
  });
  location.href = '../index.html';   // nach Registrierung zur Startseite
}
