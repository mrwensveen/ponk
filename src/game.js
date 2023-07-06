class Game {
  static fps = 60;
  static perfectFrameTime = 1000 / Game.fps; // ms/f

  #previousTimestamp = 0;

  p1;
  p2;

  constructor(id, width, height) {
    console.log('Game', id, width, height);

    this.id = id;
    this.width = width;
    this.height = height;

    const angle = (.25 + Math.random() * .5) * Math.PI * (Math.random() >= .5 ? 1 : -1);
    const velocity = 300; // px/s
    const vector = getVector(angle, velocity / Game.fps); // px/f

    this.puck = new Puck(
      { x: width / 2, y: height / 2 },
      vector,
    );
  }

  step(timestamp) {
    if (timestamp <= this.#previousTimestamp) return;

    const actualFrameTime = timestamp - this.#previousTimestamp;
    const deltaTime = this.#previousTimestamp ? actualFrameTime / Game.perfectFrameTime : 0;
    //console.log('step', Game.perfectFrameTime, actualFrameTime, deltaTime);

    this.#previousTimestamp = timestamp;

    this.puck.update(deltaTime);

    if (this.puck.pos.x <= 0) {
      this.puck.mov.x = Math.abs(this.puck.mov.x);
    }
    if (this.puck.pos.x >= this.width - 10) {
      this.puck.mov.x = -1 * Math.abs(this.puck.mov.x)
    }
    if (this.puck.pos.y <= 0) {
      this.puck.mov.y = Math.abs(this.puck.mov.y);
    }
    if (this.puck.pos.y >= this.height - 10) {
      this.puck.mov.y = -1 * Math.abs(this.puck.mov.y)
    }
  }

  render() {
    return {
      p1: this.p1.x,
      p2: this.p2.x,
      puck: this.puck.pos,
    };
  }
}

class Puck {
  constructor(pos, mov) {
    this.pos = pos;
    this.mov = mov;
  }

  bounce(direction, fa = 1, fv = 1) {
    //console.log('bounce', direction, fa, fv);

    if (direction === Bounce.Horizontal) {
      this.mov.y *= -1;
    } else if (direction === Bounce.Vertical) {
      this.mov.x *= -1;
    }

    // adjust angle and velocity by a factor
    if (fa != 1 || fv != 1) {
      const v = Math.sqrt(this.mov.x ** 2 + this.mov.y ** 2);

      if (fa != 1) {
        const a = Math.acos(this.mov.x / v);
        this.mov = getVector(a * fa, v);
      }
      if (fv != 1) {
        this.mov.x *= fv;
        this.mov.y *= fv;
      }
    }
  }

  update(deltaTime) {
    //console.log(deltaTime);
    this.pos.x += this.mov.x * deltaTime;
    this.pos.y += this.mov.y * deltaTime;
  }
}

class Paddle {
  constructor(id, x) {
    this.id = id;
    this.x = x;
  }
}

const Bounce = Object.freeze({
  Horizontal: "Horizontal",
  Vertical: "Vertical",
});

function getVector(angle, length) {
  return { x: Math.cos(angle) * length, y: Math.sin(angle) * length };
}

module.exports = { Game, Paddle };
