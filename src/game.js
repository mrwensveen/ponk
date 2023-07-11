class Game {
  static fps = 60;
  static perfectFrameTime = 1000 / Game.fps; // ms/f

  #previousTimestamp = 0;

  p1;
  p2;
  onScore = () => { }

  constructor(id, width, height, onScore) {
    console.log('Game', id, width, height);

    this.id = id;
    this.width = width;
    this.height = height;
    this.onScore = onScore;

    this.init();
  }

  init() {
    this.puck = new Puck(
      { x: this.width / 2, y: this.height / 2 },
      { x: 0, y: 0 },
    );
  }

  start() {
    const angle = (.25 + Math.random() * .5) * Math.PI * (Math.random() >= .5 ? 1 : -1);
    const velocity = 300; // px/s
    const vector = getVector(angle, velocity / Game.fps); // px/f

    this.puck.mov = vector;

    //console.log('game.start', angle, velocity, vector, this);
  }

  step(timestamp) {
    if (timestamp <= this.#previousTimestamp) return;

    //console.log('step', this.puck);

    const actualFrameTime = timestamp - this.#previousTimestamp;
    const deltaTime = this.#previousTimestamp ? actualFrameTime / Game.perfectFrameTime : 0;
    //console.log('step', Game.perfectFrameTime, actualFrameTime, deltaTime);

    this.#previousTimestamp = timestamp;

    this.puck.update(deltaTime);

    if (this.puck.pos.x <= 0 && this.puck.mov.x < 0) {
      this.puck.bounce(Bounce.Left);
    }

    if (this.puck.pos.x + Puck.width >= this.width && this.puck.mov.x > 0) {
      this.puck.bounce(Bounce.Right);
    }

    if (this.puck.pos.y <= Player.height
      && this.puck.pos.x + Puck.width >= this.p1.x
      && this.puck.pos.x <= (this.p1.x + Player.width)
      && this.puck.mov.y < 0
    ) {
      const [fa, fv] = getBounceAdjustment(this.puck, this.p1);
      this.puck.bounce(Bounce.Top, fa, fv);
      //this.puck.bounce(Bounce.Top);
    }
    if (this.puck.pos.y <= 0) {
      this.init();
      this.p2.score++;
      this.onScore(this.renderScore());
    }

    if (this.puck.pos.y + Puck.height >= this.height - Player.height
      && this.puck.pos.x + Puck.width >= this.p2.x
      && this.puck.pos.x <= (this.p2.x + Player.width)
      && this.puck.mov.y > 0
    ) {
      const [fa, fv] = getBounceAdjustment(this.puck, this.p2);
      this.puck.bounce(Bounce.Bottom, fa, fv);
      //this.puck.bounce(Bounce.Bottom);
    }
    if (this.puck.pos.y + Puck.height >= this.height) {
      this.init();
      this.p1.score++;
      this.onScore(this.renderScore());
    }

    return actualFrameTime;
  }

  renderGame() {
    return {
      p1: this.p1.x,
      p2: this.p2.x,
      puck: this.puck.pos,
    };
  }

  renderScore() {
    return { p1: this.p1.score, p2: this.p2.score };
  }
}

class Puck {
  static width = 10;
  static height = 10;

  constructor(pos, mov) {
    this.pos = pos;
    this.mov = mov;
  }

  bounce(direction, fa = 0, fv = 0) {
    const currentAngle = Math.atan2(this.mov.y, this.mov.x);

    const refractionAngle = ((d, f) => {
      switch (d) {
        case Bounce.Bottom:
          return 0 + f;

        case Bounce.Left:
          return .5 * Math.PI;

        case Bounce.Top:
          return Math.PI - f;

        case Bounce.Right:
          return 1.5 * Math.PI;

      }
    })(direction, fa);

    const v = (1 + fv) * Math.sqrt(this.mov.x ** 2 + this.mov.y ** 2);
    const a = 2 * refractionAngle - currentAngle;

    this.mov = getVector(a, v);


    // adjust angle
    //if (fa != 1) {
    //  const v = Math.sqrt(this.mov.x ** 2 + this.mov.y ** 2);
    //  const a = Math.atan2(this.mov.y, this.mov.x);

    //  this.mov = getVector((a + fa) / 2, v);
    //}

    //if (fv != 1) {
    //  this.mov.x *= fv;
    //  this.mov.y *= fv;
    //}
  }

  update(deltaTime) {
    //console.log(deltaTime);
    this.pos.x += this.mov.x * deltaTime;
    this.pos.y += this.mov.y * deltaTime;
  }
}

class Player {
  static width = 100;
  static height = 20;
  score = 0;

  constructor(id, x) {
    this.id = id;
    this.x = x;
  }
}

const Bounce = Object.freeze({
  Top: 'Top',
  Right: 'Right',
  Bottom: 'Bottom',
  Left: 'Left',
});

function getVector(angle, length) {
  return { x: Math.cos(angle) * length, y: Math.sin(angle) * length };
}

function getBounceAdjustment(puck, player) {
  // Between 0 and 1
  const b = (puck.pos.x + Puck.width - player.x) / (Player.width + Puck.width);

  // Between
  return [Math.PI * (b / 4 - .125), Math.abs(b - .5) / 10];
}

module.exports = { Game, Player };
