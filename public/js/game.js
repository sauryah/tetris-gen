class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.board = new Board();
    this.scoring = new Scoring();
    this.audio = new Audio();
    this.input = new Input();
    this.bag = new PieceBag();

    this.state = STATES.MENU;
    this.currentPiece = null;
    this.holdPiece = null;
    this.holdUsed = false;
    this.lockTimer = 0;
    this.lockMoves = 0;
    this.gravityTimer = 0;
    this.softDropping = false;
    this.onGameOver = null;

    this.setupInput();
  }

  setupInput() {
    this.input.on('left', () => {
      if (this.state !== STATES.PLAYING || !this.currentPiece) return;
      if (this.board.isValid(this.currentPiece, -1, 0)) {
        this.currentPiece.x--;
        this.audio.move();
        this.resetLockIfActive();
      }
    });

    this.input.on('right', () => {
      if (this.state !== STATES.PLAYING || !this.currentPiece) return;
      if (this.board.isValid(this.currentPiece, 1, 0)) {
        this.currentPiece.x++;
        this.audio.move();
        this.resetLockIfActive();
      }
    });

    this.input.on('softDrop', () => {
      if (this.state !== STATES.PLAYING || !this.currentPiece) return;
      if (this.board.isValid(this.currentPiece, 0, 1)) {
        this.currentPiece.y++;
        this.scoring.addSoftDrop(1);
        this.gravityTimer = 0;
      }
    });

    this.input.on('hardDrop', () => {
      if (this.state !== STATES.PLAYING || !this.currentPiece) return;
      let dropped = 0;
      while (this.board.isValid(this.currentPiece, 0, 1)) {
        this.currentPiece.y++;
        dropped++;
      }
      this.scoring.addHardDrop(dropped);
      this.audio.drop();
      this.renderer.shake(4);
      this.lockPiece();
    });

    this.input.on('rotateCW', () => {
      if (this.state !== STATES.PLAYING || !this.currentPiece) return;
      this.tryRotate(1);
    });

    this.input.on('rotateCCW', () => {
      if (this.state !== STATES.PLAYING || !this.currentPiece) return;
      this.tryRotate(-1);
    });

    this.input.on('hold', () => {
      if (this.state !== STATES.PLAYING || !this.currentPiece || this.holdUsed) return;
      this.doHold();
    });

    this.input.on('pause', () => {
      if (this.state === STATES.PLAYING) {
        this.state = STATES.PAUSED;
      } else if (this.state === STATES.PAUSED) {
        this.state = STATES.PLAYING;
      }
    });
  }

  tryRotate(dir) {
    const piece = this.currentPiece;
    const fromRot = piece.rotation;
    const toRot = ((fromRot + dir) % 4 + 4) % 4;
    const rotatedShape = piece.rotate(dir);
    const kicks = piece.getKickTests(fromRot, toRot);

    for (const [dx, dy] of kicks) {
      if (this.board.isValid(piece, dx, -dy, rotatedShape)) {
        piece.shape = rotatedShape;
        piece.x += dx;
        piece.y -= dy;
        piece.rotation = toRot;
        this.audio.rotate();
        this.resetLockIfActive();
        return;
      }
    }
  }

  doHold() {
    this.audio.hold();
    this.holdUsed = true;
    const currentType = this.currentPiece.type;

    if (this.holdPiece) {
      const heldType = this.holdPiece;
      this.holdPiece = currentType;
      this.currentPiece = new Piece(heldType);
    } else {
      this.holdPiece = currentType;
      this.spawnPiece();
    }
    this.lockTimer = 0;
    this.lockMoves = 0;
  }

  spawnPiece() {
    const type = this.bag.next();
    this.currentPiece = new Piece(type);
    this.holdUsed = false;
    this.lockTimer = 0;
    this.lockMoves = 0;
    this.gravityTimer = 0;

    if (!this.board.isValid(this.currentPiece, 0, 0)) {
      this.gameOver();
    }
  }

  lockPiece() {
    this.board.lock(this.currentPiece);
    this.audio.lock();

    const fullLines = this.board.findFullLines();
    if (fullLines.length > 0) {
      this.state = STATES.LINE_CLEAR;
      this.currentPiece = null;
      this.renderer.startLineClear(fullLines);

      for (const r of fullLines) {
        const cells = [];
        for (let c = 0; c < COLS; c++) {
          cells.push({ x: c, y: r });
        }
        this.renderer.addParticles(cells, '#ffffff');
      }

      if (fullLines.length === 4) {
        this.audio.tetris();
      } else {
        this.audio.lineClear(fullLines.length);
      }

      setTimeout(() => {
        this.board.clearLines(fullLines);
        const oldLevel = this.scoring.level;
        this.scoring.addLineClear(fullLines.length);
        if (this.scoring.level > oldLevel) {
          this.audio.levelUp();
        }
        this.state = STATES.PLAYING;
        this.spawnPiece();
      }, 400);
    } else {
      this.spawnPiece();
    }
  }

  resetLockIfActive() {
    if (this.lockTimer > 0 && this.lockMoves < LOCK_MOVE_LIMIT) {
      this.lockTimer = 0;
      this.lockMoves++;
    }
  }

  gameOver() {
    this.state = STATES.GAME_OVER;
    this.audio.gameOver();
    this.currentPiece = null;
    if (this.onGameOver) {
      this.onGameOver(this.scoring.score, this.scoring.level, this.scoring.lines);
    }
  }

  start() {
    this.board.reset();
    this.scoring.reset();
    this.bag = new PieceBag();
    this.holdPiece = null;
    this.holdUsed = false;
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockMoves = 0;
    this.currentPiece = null;
    this.renderer.particles = [];
    this.state = STATES.PLAYING;
    this.audio.init();
    this.audio.resume();
    this.spawnPiece();
  }

  update(dt) {
    this.input.update(dt);

    if (this.state !== STATES.PLAYING) return;
    if (!this.currentPiece) return;

    this.softDropping = this.input.isHeld('softDrop');

    const gravity = this.softDropping ? SOFT_DROP_SPEED : this.scoring.getGravity();
    this.gravityTimer += dt;

    if (this.gravityTimer >= gravity) {
      this.gravityTimer = 0;
      if (this.board.isValid(this.currentPiece, 0, 1)) {
        this.currentPiece.y++;
        if (this.softDropping) this.scoring.addSoftDrop(1);
      }
    }

    const onGround = !this.board.isValid(this.currentPiece, 0, 1);
    if (onGround) {
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY) {
        this.lockPiece();
      }
    } else {
      this.lockTimer = 0;
    }
  }
}
