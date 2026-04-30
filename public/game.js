let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let lastWinner = null;
let lastDraw = false;

const winConditions = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function initGame() {
  board = ['', '', '', '', '', '', '', '', ''];
  currentPlayer = 'X';
  gameActive = true;
  lastWinner = null;
  lastDraw = false;
  document.getElementById('status-msg').textContent = "X's turn";
  document.getElementById('save-btn').disabled = true;
  document.querySelectorAll('.cell').forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('x-color', 'o-color');
  });
}

function cellClicked(index) {
  if (!gameActive || board[index] !== '') return;
  board[index] = currentPlayer;
  const cell = document.querySelectorAll('.cell')[index];
  cell.textContent = currentPlayer;
  cell.classList.add(currentPlayer === 'X' ? 'x-color' : 'o-color');

  if (checkWinner()) {
    document.getElementById('status-msg').textContent = `${currentPlayer} wins! 🎉`;
    updateScore(currentPlayer);
    gameActive = false;
    lastWinner = currentPlayer;
    lastDraw = false;
    document.getElementById('save-btn').disabled = false;
    return;
  }

  if (board.every(c => c !== '')) {
    document.getElementById('status-msg').textContent = "It's a draw!";
    gameActive = false;
    lastWinner = null;
    lastDraw = true;
    document.getElementById('save-btn').disabled = false;
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  document.getElementById('status-msg').textContent = `${currentPlayer}'s turn`;
}

function checkWinner() {
  return winConditions.some(([a, b, c]) =>
    board[a] && board[a] === board[b] && board[a] === board[c]
  );
}

function updateScore(winner) {
  const id = winner === 'X' ? 'score-x' : 'score-o';
  const el = document.getElementById(id);
  el.textContent = parseInt(el.textContent) + 1;
}

function resetGame() {
  initGame();
}

async function saveGame() {
  const btn = document.getElementById('save-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';
  try {
    const res = await fetch('/save-game-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner: lastWinner, draw: lastDraw, board })
    });
    const data = await res.json();
    if (data.success) {
      btn.textContent = 'Saved! ✓';
    } else {
      btn.textContent = 'Error saving';
    }
  } catch (err) {
    btn.textContent = 'Error saving';
    console.error(err);
  }
}