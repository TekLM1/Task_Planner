const API = 'http://localhost:3001/api';

async function post(path, data){
  const r = await fetch(API + path, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    credentials:'include',
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error((await r.json()).error || 'Fehler');
  return r.json().catch(()=> ({}));
}

document.getElementById('login-form')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  try{
    await post('/auth/login', { email: fd.get('email'), password: fd.get('password') });
    location.href = '../index.html';
  }catch(err){ document.getElementById('err').textContent = err.message; }
});

document.getElementById('reg-form')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  try{
    await post('/auth/register', {
      name: fd.get('name'),
      email: fd.get('email'),
      password: fd.get('password'),
      role: fd.get('role')
    });
    location.href = '../index.html';
  }catch(err){ document.getElementById('err').textContent = err.message; }
});
