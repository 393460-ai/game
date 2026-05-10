require("dotenv").config();
const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 8080;
const USERS_FILE = path.join(__dirname, "data", "users.json");
const GAMES_FILE = path.join(__dirname, "data", "games.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: process.env.SESSION_SECRET || "tictactoe-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 },
}));

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}
function readGames() {
  if (!fs.existsSync(GAMES_FILE)) return [];
  return JSON.parse(fs.readFileSync(GAMES_FILE, "utf8"));
}

app.get("/me", (req, res) => {
  if (req.session.username) {
    res.json({ loggedIn: true, username: req.session.username });
  } else {
    res.json({ loggedIn: false });
  }
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required." });
  }
  const users = readUsers();
  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ success: false, message: "Username is already taken." });
  }
  users.push({ username, password, wins: 0, losses: 0, draws: 0 });
  saveUsers(users);
  req.session.username = username;
  res.json({ success: true, username });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required." });
  }
  const users = readUsers();
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid username or password." });
  }
  req.session.username = username;
  res.json({ success: true, username });
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.post("/save-game", (req, res) => {
  const { winner, draw, board } = req.body;
  const games = readGames();
  games.push({
    id: Date.now(),
    player: req.session.username || "guest",
    winner: draw ? "draw" : winner,
    board,
    date: new Date().toISOString(),
  });
  fs.writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2));
  res.json({ success: true });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});