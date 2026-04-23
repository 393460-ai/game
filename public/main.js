// ═══════════════════════════════════════════════════════
//  MAIN.JS — Auth + Game logic
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
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  clearMessages();
}

function showGameScreen(username) {
  document.getElementById('player-name').textContent = username;
  document.getElementById('player-initial').textContent = username.charAt(0).toUpperCase();
  showScreen('game-screen');
  resetGame();
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

// ═══════════════════════════════════════════════════════
//  GAME LOGIC
// ═══════════════════════════════════════════════════════

let board = Array(9).fill(null);
let currentPlayer = 'X';
let gameOver = false;
let scores = { X: 0, O: 0 };

const WIN_PATTERNS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function handleMove(index) {
  if (gameOver || board[index]) return;

  board[index] = currentPlayer;
  const cells = document.querySelectorAll('.cell');
  cells[index].textContent = currentPlayer;
  cells[index].classList.add('taken', currentPlayer.toLowerCase());

  const winningCells = checkWinner();

  if (winningCells) {
    gameOver = true;
    winningCells.forEach(i => cells[i].classList.add('win'));
    scores[currentPlayer]++;
    updateScores();
    setStatus(currentPlayer + ' wins! 🎉');
  } else if (board.every(c => c !== null)) {
    gameOver = true;
    setStatus("It's a draw!");
  } else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    setStatus(currentPlayer + "'s turn");
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

function setStatus(msg) {
  document.getElementById('status-msg').textContent = msg;
}

function updateScores() {
  document.getElementById('score-x').textContent = scores.X;
  document.getElementById('score-o').textContent = scores.O;
}

function resetGame() {
  board = Array(9).fill(null);
  currentPlayer = 'X';
  gameOver = false;
  document.querySelectorAll('.cell').forEach(cell => {
    cell.textContent = '';
    cell.className = 'cell';
  });
  setStatus("X's turn");
}