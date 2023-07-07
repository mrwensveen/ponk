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
    display = { socket, game: new Game(null, width, height) };

    socket.on('disconnect', () => {
      console.log('Display disconnected');

      stopGame(display);
      display = null;
    });
  } else {
    console.log('Player connected.');

    const player = new Player(socket.handshake.query.id, 0);
    players.push(player);

    socket.on('move', (data) => {
      //console.log(data);

      player.x = data.x;
    });

    socket.on('disconnect', () => {
      players = players.filter((p) => p.id !== player.id);

      console.log('A user disconnected.');
    });

    if (display && players.length === 2) {
      display.game.p1 = players[0];
      display.game.p2 = players[1];

      startGame(display);
    }
  }
});

// Game loop

let running = null;
function startGame({ socket, game }) {
  function step() {
    if (!running) return;

    const timestamp = Date.now();
    //console.log(Game.perfectFrameTime, timestamp);

    game.step(timestamp);
    //const frameTime = game.step(timestamp);
    const render = game.render();

    //console.log(render);
    socket.emit('game', render);

    //socket.emit('game', render, () => {
    //  const renderTime = Date.now() - timestamp;
    //  const delay = Game.perfectFrameTime - renderTime;

    //  //console.log('game', ack, renderTime, delay)
    //  running = setTimeout(step, delay);
    //});

    const renderTime = Date.now() - timestamp;
    const delay = Game.perfectFrameTime - renderTime;

    //const delay = 2 * Game.perfectFrameTime - frameTime;
    running = setTimeout(step, delay);

    //running = setImmediate(step);
    //running = setTimeout(step, 20);
  }

  //running = setImmediate(step, 0);
  running = setTimeout(step, 0);
}

function stopGame(_) {
  if (running !== null) {
    //clearImmediate(running);
    clearTimeout(running);
    running = null;
  }
}
