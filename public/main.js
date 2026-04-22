// ═══════════════════════════════════════════════════════
//  MAIN.JS — Auth + Game logic
//  HOW IT WORKS:
//  1. Page loads → ask server "am I logged in?" (/me)
//  2. Server checks the session cookie it stored
//  3. Show auth screen or game screen based on answer
// ═══════════════════════════════════════════════════════


// ── ON PAGE LOAD ─────────────────────────────────────────
// This runs immediately when the page opens.
// We ask the server if the user already has a valid session
// (e.g. they logged in yesterday and the session is still alive)
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
// We only have two screens (auth and game).
// We hide/show them by toggling the 'hidden' CSS class.

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function showTab(tab) {
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  clearMessages();
}

function showGameScreen(username) {
  document.getElementById('welcome-msg').textContent = 'Hi, ' + username + '!';
  showScreen('game-screen');
  resetGame();
}


// ── MESSAGES (error / success banners) ───────────────────
function showMessage(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'message ' + type; // 'message error' or 'message success'
}

function clearMessages() {
  ['login-message', 'register-message'].forEach(id => {
    const el = document.getElementById(id);
    el.textContent = '';
    el.className = 'message';
  });
}


// ── LOGIN ────────────────────────────────────────────────
// Sends username + password to POST /login
// Server checks users.json, creates a session if correct
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
// Sends username + password to POST /register
// Server validates, writes to users.json, creates a session
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
// Tells server to destroy the session, then shows auth screen
async function handleLogout() {
  await fetch('/logout', { method: 'POST' });
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  clearMessages();
  showTab('login');
  showScreen('auth-screen');
}


// ═══════════════════════════════════════════════════════
//  GAME LOGIC
// ═══════════════════════════════════════════════════════

let board = Array(9).fill(null); // 9 cells, null = empty
let currentPlayer = 'X';
let gameOver = false;

const WIN_PATTERNS = [
  [0,1,2], [3,4,5], [6,7,8], // rows
  [0,3,6], [1,4,7], [2,5,8], // columns
  [0,4,8], [2,4,6]           // diagonals
];

function handleMove(index) {
  if (gameOver || board[index]) return; // ignore if game over or cell taken

  board[index] = currentPlayer;

  const cell = document.querySelectorAll('.cell')[index];
  cell.textContent = currentPlayer;
  cell.classList.add('taken', currentPlayer.toLowerCase());

  const winningCells = checkWinner();

  if (winningCells) {
    gameOver = true;
    winningCells.forEach(i => document.querySelectorAll('.cell')[i].classList.add('win'));
    document.getElementById('status-msg').textContent = currentPlayer + ' wins! 🎉';

  } else if (board.every(c => c !== null)) {
    gameOver = true;
    document.getElementById('status-msg').textContent = "It's a draw!";

  } else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    document.getElementById('status-msg').textContent = currentPlayer + "'s turn";
  }
}

function checkWinner() {
  for (const [a, b, c] of WIN_PATTERNS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [a, b, c];
    }
  }
  return null;
}

function resetGame() {
  board = Array(9).fill(null);
  currentPlayer = 'X';
  gameOver = false;

  document.querySelectorAll('.cell').forEach(cell => {
    cell.textContent = '';
    cell.className = 'cell';
  });

  document.getElementById('status-msg').textContent = "Your turn (X)";
}