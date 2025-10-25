const API_BASE = (location.protocol === 'file:') ? 'http://localhost:3000/api' : '/api';
const byId = id => document.getElementById(id);
const form = byId('login-form');
const alertArea = byId('alert-area');

const showAlert = (msg, type='danger') => {
  alertArea.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
};

const getParam = (name) => new URLSearchParams(location.search).get(name);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertArea.innerHTML = '';
  const email = byId('email').value;
  const password = byId('password').value;
  try {
    const res = await fetch(`${API_BASE}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
    if (!res.ok) {
      // intentar obtener detalle si viene JSON
      let errMsg = 'Error en el login';
      try { const j = await res.json(); if (j && j.message) errMsg = j.message; } catch(_){}
      throw new Error(errMsg);
    }
    const body = await res.json();
    // guardar cookie
    document.cookie = `token=${encodeURIComponent(body.token)}; path=/`;
    // redirigir al 'next' si existe
    const next = getParam('next') || '/';
    window.location.href = next;
  } catch (err) {
    showAlert(err.message || String(err));
  }
});