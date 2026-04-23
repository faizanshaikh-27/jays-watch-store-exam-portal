// auth.js
let currentUser = null;

async function login() {
  const username = el('login-username').value.trim();
  const password = el('login-password').value;
  const errEl = el('login-error');
  errEl.classList.add('hidden');

  if (!username || !password) {
    errEl.textContent = 'Please enter username and password.';
    errEl.classList.remove('hidden');
    return;
  }

  try {
    const data = await API.login({ username, password });
    localStorage.setItem('token', data.token);
    currentUser = data.user;
    initApp();
  } catch (err) {
    errEl.textContent = err.message || 'Login failed.';
    errEl.classList.remove('hidden');
  }
}

function logout() {
  localStorage.removeItem('token');
  currentUser = null;
  showPage('page-login');
  el('layout-admin').classList.add('hidden');
  el('layout-staff').classList.add('hidden');
}

async function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    currentUser = await API.me();
    return true;
  } catch {
    localStorage.removeItem('token');
    return false;
  }
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(pageId);
  if (target) target.classList.add('active');
}

// Allow Enter key to login
document.addEventListener('DOMContentLoaded', () => {
  ['login-username', 'login-password'].forEach(id => {
    const el2 = document.getElementById(id);
    if (el2) el2.addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
  });
});
