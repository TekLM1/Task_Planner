const API =
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3001/api'
    : 'https://task-planner-api-af72.onrender.com/api';

function authHeader(){
  const t = localStorage.getItem('token');
  return t ? { 'Authorization': 'Bearer ' + t } : {};
}

document.addEventListener('DOMContentLoaded', ()=>{
  const lf = document.getElementById('login-form');
  if (lf) lf.addEventListener('submit', onLogin);

  const rf = document.getElementById('reg-form');
  if (rf) rf.addEventListener('submit', onRegister);
});

async function post(path, data){
  const r = await fetch(API + path, {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    credentials:'include',
    body: JSON.stringify(data)
  });
  const json = await r.json().catch(()=> ({}));
  if (!r.ok) throw new Error(json.error || 'Fehler');

  if (json.token) localStorage.setItem('token', json.token);

  return json;
}


async function onLogin(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  await post('/auth/login', { email: fd.get('email'), password: fd.get('password') });
  location.href = '../index.html';
}

async function onRegister(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  await post('/auth/register', {
    name: fd.get('name'),
    email: fd.get('email'),
    password: fd.get('password'),
    role: fd.get('role')
  });
  location.href = '../index.html';
}
