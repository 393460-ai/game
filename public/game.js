// ═══════════════════════════════════════════════════════
//  GAME.JS — Tic Tac Toe logic
// ═══════════════════════════════════════════════════════

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;

const winConditions = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // cols
  [0,4,8],[2,4,6]          // diagonals
];

function initGame() {
  board = ['', '', '', '', '', '', '', '', ''];
  currentPlayer = 'X';
  gameActive = true;
  document.getElementById('status-msg').textContent = "X's turn";
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
    return;
  }

  if (board.every(cell => cell !== '')) {
    document.getElementById('status-msg').textContent = "It's a draw!";
    gameActive = false;
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