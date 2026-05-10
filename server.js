require("dotenv").config();
const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const Groq = require("groq-sdk");
const app = express();
const PORT = process.env.PORT || 3000;

let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}
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

app.post("/ai-move", async (req, res) => {
  const { board, difficulty, personality } = req.body;
  const empty = board.map((v, i) => v === '' ? i : null).filter(v => v !== null);

  const personalities = {
    friendly: {
      easy: ["Good try! 😊", "Nice move!", "You're doing great!", "Keep it up!"],
      win: ["I got lucky! 😄", "Good game!", "That was fun!"],
      block: ["Oops, can't let you do that! 😅", "Close one!"]
    },
    neutral: {
      easy: ["Hmm, let me think... 🤔", "Interesting move.", "Your move.", "OK."],
      win: ["I win.", "Game over.", "Better luck next time."],
      block: ["Blocked.", "Not today.", "Nope."]
    },
    savage: {
      easy: ["Is that the best you got? are u blind? 😂", "My grandma plays better.", "LOL okay.", "Try harder."],
      win: ["EZ game EZ life 😎", "Not even close.", "Did you even try?", "Embarrassing."],
      block: ["your buns at this game 😂", "Did you really think that would work?", "BLOCKED. Get rekt."]
    }
  };

  const p = personalities[personality] || personalities.neutral;
  const getComment = (type) => {
    const list = p[type] || p.easy;
    return list[Math.floor(Math.random() * list.length)];
  };

  if (difficulty === 'easy') {
    const move = empty[Math.floor(Math.random() * empty.length)];
    return res.json({ success: true, move, comment: getComment('easy') });
  }

  if (difficulty === 'medium') {
    const move = smartMove(board, empty);
    const isWin = checkWin(board, move, 'O');
    const isBlock = checkWin(board, move, 'X');
    const comment = isWin ? getComment('win') : isBlock ? getComment('block') : getComment('easy');
    return res.json({ success: true, move, comment });
  }

  try {
    const move = smartMove(board, empty);
    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      max_tokens: 20,
      messages: [
        { role: "system", content: `You are a Tic Tac Toe AI. Respond with ONLY a short comment. Personality: ${personality || 'neutral'}.` },
        { role: "user", content: `Say something ${personality === 'savage' ? 'mean' : personality === 'friendly' ? 'friendly' : 'neutral'} in under 8 words.` }
      ]
    });
    const comment = response.choices[0].message.content.trim();
    res.json({ success: true, move, comment });
  } catch (err) {
    const move = smartMove(board, empty);
    res.json({ success: true, move, comment: getComment('easy') });
  }
});

function checkWin(board, move, player) {
  const test = [...board];
  test[move] = player;
  return [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
    .some(([a,b,c]) => test[a] === player && test[b] === player && test[c] === player);
}

function smartMove(board, empty) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of lines) {
    if (board[a]==='O' && board[b]==='O' && board[c]==='') return c;
    if (board[a]==='O' && board[c]==='O' && board[b]==='') return b;
    if (board[b]==='O' && board[c]==='O' && board[a]==='') return a;
  }
  for (const [a,b,c] of lines) {
    if (board[a]==='X' && board[b]==='X' && board[c]==='') return c;
    if (board[a]==='X' && board[c]==='X' && board[b]==='') return b;
    if (board[b]==='X' && board[c]==='X' && board[a]==='') return a;
  }
  if (board[4] === '') return 4;
  return empty[Math.floor(Math.random() * empty.length)];
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});