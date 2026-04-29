// ═══════════════════════════════════════════════════════
//  MAIN.JS — Auth only (game logic is in game.js)
// ═══════════════════════════════════════════════════════

// ── ON PAGE LOAD ─────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  const res = await fetch('/me');
  const data = await res.json();

  if (data.loggedIn) {
    showGameScreen(data.username);
  } else {
    showScreen('auth-screen');
  }
});

// ── SCREEN SWITCHING ─────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function showTab(tab) {
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab !== 'login');
  clearMessages();
}

function showGameScreen(username) {
  document.getElementById('player-name').textContent = username;
  document.getElementById('player-initial').textContent = username.charAt(0).toUpperCase();
  showScreen('game-screen');
  initGame(); // defined in game.js
}

// ── MESSAGES ─────────────────────────────────────────────
function showMessage(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'message ' + type;
}

function clearMessages() {
  ['login-message', 'register-message'].forEach(id => {
    const el = document.getElementById(id);
    el.textContent = '';
    el.className = 'message';
  });
}

// ── LOGIN ─────────────────────────────────────────────────
async function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
    return showMessage('login-message', 'Please fill in all fields.', 'error');
  }

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      showMessage('login-message', 'Welcome back!', 'success');
      setTimeout(() => showGameScreen(data.username), 600);
    } else {
      showMessage('login-message', data.message, 'error');
    }
  } catch (err) {
    showMessage('login-message', 'Could not reach server.', 'error');
  }
}

// ── REGISTER ─────────────────────────────────────────────
async function handleRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm').value;

  if (!username || !password || !confirm) {
    return showMessage('register-message', 'Please fill in all fields.', 'error');
  }
  if (password !== confirm) {
    return showMessage('register-message', 'Passwords do not match.', 'error');
  }

  try {
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      showMessage('register-message', 'Account created!', 'success');
      setTimeout(() => showGameScreen(data.username), 600);
    } else {
      showMessage('register-message', data.message, 'error');
    }
  } catch (err) {
    showMessage('register-message', 'Could not reach server.', 'error');
  }
}

// ── LOGOUT ───────────────────────────────────────────────
async function handleLogout() {
  await fetch('/logout', { method: 'POST' });
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  clearMessages();
  showTab('login');
  showScreen('auth-screen');
}