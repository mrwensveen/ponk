require('dotenv').config();

const fs = require('fs');
const path = require('path');
const serveStatic = require('serve-static')(`${__dirname}/static`, { index: ['index.html'] });
const app = require('http').createServer(
  (req, res) => serveStatic(req, res, handler(req, res)),
);
const io = require('socket.io')(app);

const { Game, Player } = require(`${__dirname}/game.js`);

app.listen(process.env.PORT);

console.log(`Server running on port ${process.env.PORT}`);

// HTTP

function handler(_req, res) {
  return () => {
    servePath(res, '/controller.html');
  };
}

function servePath(res, filePath) {
  fs.readFile(
    path.join(__dirname, filePath),
    (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end(`Error loading ${filePath}`);
      }

      res.writeHead(200);
      return res.end(data);
    },
  );
}

// Socket.io and Game init

let display = null;
let players = [];

io.on('connection', (socket) => {
  //console.log('A socket connected.', socket.handshake.query);

  if (socket.handshake.query.role === 'display') {
    console.log('Display connected.');

    var { width, height } = socket.handshake.query;
    display = { socket, game: new Game(null, width, height, onScore, onBounce) };

    socket.on('disconnect', () => {
      console.log('Display disconnected');

      stopGame(display);
      display = null;
    });
  } else {
    console.log('Player connected.');

    const player = { socket, player: new Player(socket.handshake.query.id, 0) };
    players.push(player);

    socket.on('move', (data) => {
      if (display) {
        player.player.x = data.x * (display.game.width - Player.width);
      }
    });

    socket.on('disconnect', () => {
      console.log('Player disconnected.');

      players = players.filter((p) => p.player.id !== player.player.id);
      stopGame(display);
    });
  }

  if (display?.game && players.length === 2) {
    display.game.p1 = players.find(p => p.player.id === '/1').player;
    display.game.p1.score = 0;

    display.game.p2 = players.find(p => p.player.id === '/2').player;
    display.game.p2.score = 0;

    startGame(display);
  }
});

// Game loop

let running = null;
function startGame({ socket, game }) {
  console.log('startGame');

  function step() {
    if (!running) return;

    const timestamp = Date.now();
    game.step(timestamp);

    const render = game.renderGame();

    //console.log(render);
    socket.emit('game', render);

    const renderTime = Date.now() - timestamp;
    const delay = Game.perfectFrameTime - renderTime;

    running = setTimeout(step, delay);
  }

  socket.emit('score', { p1: game.p1.score, p2: game.p2.score });
  setTimeout(() => game.start(), 1000);
  running = setTimeout(step, 0);
}

function stopGame(_) {
  if (running !== null) {
    clearTimeout(running);
    running = null;
  }
}

function onScore(score) {
  display.socket.emit('score', score);

  if (score.p1 === 5 || score.p2 === 5) {
    // Game over

    players.forEach(p => p.player.score = 0);

    setTimeout(() => display?.socket.emit('score', display?.game.renderScore()), 3000);
    setTimeout(() => display?.game.start(), 6000);
  } else {
    setTimeout(() => display?.game.start(), 3000);
  }
}

function onBounce(direction) {
  display.socket.emit('bounce', direction);
}
