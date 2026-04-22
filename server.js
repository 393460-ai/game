// Load .env variables (ALWAYS first line)
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// ── MIDDLEWARE ────────────────────────────────────────────
// Lets Express read JSON from fetch() calls
app.use(express.json());

// Serves everything in /public to the browser
app.use(express.static(path.join(__dirname, 'public')));

// Session: keeps track of who is logged in
// WHY: HTTP is stateless — sessions let the server remember you between requests
app.use(session({
  secret: process.env.SESSION_SECRET || 'tictactoe-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// ── HELPERS ───────────────────────────────────────────────
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ── ROUTES ────────────────────────────────────────────────

// WHO AM I? — frontend calls this on page load to check if already logged in
app.get('/me', (req, res) => {
  if (req.session.username) {
    res.json({ loggedIn: true, username: req.session.username });
  } else {
    res.json({ loggedIn: false });
  }
});

// REGISTER
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  const users = readUsers();

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ success: false, message: 'Username is already taken.' });
  }

  // Save new user — plaintext password (learning purposes only, per spec)
  users.push({ username, password, wins: 0, losses: 0, draws: 0 });
  saveUsers(users);

  // Automatically log them in after registering
  req.session.username = username;

  res.json({ success: true, username });
});

// LOGIN
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  const users = readUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid username or password.' });
  }

  // Store username in session so server remembers this user
  req.session.username = username;

  res.json({ success: true, username });
});

// LOGOUT
app.post('/logout', (req, res) => {
  // Destroy the session entirely
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// ── START SERVER ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});