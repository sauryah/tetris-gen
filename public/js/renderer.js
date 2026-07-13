class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.frameCount = 0;
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.lineClearFlash = 0;
    this.lineClearRows = [];
    this.particles = [];
    this.starField = this.createStarField();
  }

  createStarField() {
    const stars = [];
    for (let i = 0; i < 40; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.3 + 0.1,
        flicker: Math.random() * Math.PI * 2,
      });
    }
    return stars;
  }

  shake(intensity) {
    this.shakeIntensity = intensity;
    this.shakeTimer = 150;
  }

  startLineClear(rows) {
    this.lineClearRows = rows;
    this.lineClearFlash = 400;
  }

  addParticles(cells, color) {
    for (const cell of cells) {
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: BOARD_X + cell.x * BLOCK_SIZE + BLOCK_SIZE / 2,
          y: BOARD_Y + cell.y * BLOCK_SIZE + BLOCK_SIZE / 2,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4 - 2,
          life: 300 + Math.random() * 200,
          maxLife: 500,
          color: color,
          size: Math.random() * 3 + 1,
        });
      }
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  drawBlock(x, y, color, size, alpha) {
    const ctx = this.ctx;
    const a = alpha || 1;
    ctx.globalAlpha = a;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(x, y, size, 2);
    ctx.fillRect(x, y, 2, size);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + size - 2, y, 2, size);
    ctx.fillRect(x, y + size - 2, size, 2);

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x + 4, y + 4, size - 8, size - 8);

    ctx.globalAlpha = 1;
  }

  drawGrid() {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;

    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(BOARD_X + c * BLOCK_SIZE + 0.5, BOARD_Y);
      ctx.lineTo(BOARD_X + c * BLOCK_SIZE + 0.5, BOARD_Y + ROWS * BLOCK_SIZE);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(BOARD_X, BOARD_Y + r * BLOCK_SIZE + 0.5);
      ctx.lineTo(BOARD_X + COLS * BLOCK_SIZE, BOARD_Y + r * BLOCK_SIZE + 0.5);
      ctx.stroke();
    }
  }

  drawBoard(board) {
    const ctx = this.ctx;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = board.grid[r][c];
        if (cell) {
          if (this.lineClearFlash > 0 && this.lineClearRows.includes(r)) {
            const flash = Math.sin(this.frameCount * 0.5) > 0;
            if (flash) {
              this.drawBlock(
                BOARD_X + c * BLOCK_SIZE,
                BOARD_Y + r * BLOCK_SIZE,
                '#ffffff',
                BLOCK_SIZE
              );
            } else {
              this.drawBlock(
                BOARD_X + c * BLOCK_SIZE,
                BOARD_Y + r * BLOCK_SIZE,
                cell,
                BLOCK_SIZE
              );
            }
          } else {
            this.drawBlock(
              BOARD_X + c * BLOCK_SIZE,
              BOARD_Y + r * BLOCK_SIZE,
              cell,
              BLOCK_SIZE
            );
          }
        }
      }
    }
  }

  drawPiece(piece) {
    const cells = piece.getCells();
    for (const cell of cells) {
      if (cell.y >= 0) {
        this.drawBlock(
          BOARD_X + cell.x * BLOCK_SIZE,
          BOARD_Y + cell.y * BLOCK_SIZE,
          piece.color,
          BLOCK_SIZE
        );
      }
    }
  }

  drawGhost(piece, board) {
    const ghostY = board.getGhostY(piece);
    if (ghostY === piece.y) return;
    const ctx = this.ctx;
    const shape = piece.shape;
    ctx.globalAlpha = GHOST_ALPHA;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const ny = ghostY + r;
        if (ny < 0) continue;
        ctx.strokeStyle = piece.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          BOARD_X + (piece.x + c) * BLOCK_SIZE + 1,
          BOARD_Y + ny * BLOCK_SIZE + 1,
          BLOCK_SIZE - 2,
          BLOCK_SIZE - 2
        );
      }
    }
    ctx.globalAlpha = 1;
  }

  drawPanel(x, y, w, h, title) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(10,10,30,0.85)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);

    ctx.fillStyle = '#888';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title, x + w / 2, y + 18);
  }

  drawPreviewPieces(types, x, y) {
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      const shape = SHAPES[type];
      const color = COLORS[type];
      const offsetY = y + i * 75;

      const cellSize = 16;
      const shapeW = shape[0].length * cellSize;
      const shapeH = shape.length * cellSize;
      const offsetX = x + (60 - shapeW) / 2;

      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            this.drawBlock(
              offsetX + c * cellSize,
              offsetY + 28 + r * cellSize,
              color,
              cellSize
            );
          }
        }
      }
    }
  }

  drawHoldPiece(type, x, y) {
    if (!type) return;
    const shape = SHAPES[type];
    const color = COLORS[type];
    const cellSize = 16;

    const shapeW = shape[0].length * cellSize;
    const offsetX = x + (60 - shapeW) / 2;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          this.drawBlock(
            offsetX + c * cellSize,
            y + 28 + r * cellSize,
            color,
            cellSize
          );
        }
      }
    }
  }

  drawText(text, x, y, size, color, align) {
    const ctx = this.ctx;
    ctx.fillStyle = color || '#fff';
    ctx.font = `${size}px "Press Start 2P", monospace`;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  }

  drawParticles() {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    this.ctx.globalAlpha = 1;
  }

  drawStars(dt) {
    const ctx = this.ctx;
    for (const star of this.starField) {
      star.flicker += star.speed * dt * 0.01;
      const alpha = 0.3 + Math.sin(star.flicker) * 0.2;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
  }

  drawScanlines() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    for (let y = 0; y < CANVAS_HEIGHT; y += 3) {
      ctx.fillRect(0, y, CANVAS_WIDTH, 1);
    }
  }

  drawBoardBorder() {
    const ctx = this.ctx;
    const bx = BOARD_X - 3;
    const by = BOARD_Y - 3;
    const bw = COLS * BLOCK_SIZE + 6;
    const bh = ROWS * BLOCK_SIZE + 6;

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx - 2, by - 2, bw + 4, bh + 4);
  }

  drawMenu() {
    const ctx = this.ctx;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.drawStars(16);

    const pulse = 0.7 + Math.sin(this.frameCount * 0.05) * 0.3;

    ctx.globalAlpha = pulse;
    this.drawText('TETRIS', CANVAS_WIDTH / 2, 180, 36, '#00f0f0', 'center');
    ctx.globalAlpha = 1;

    this.drawText('GEN', CANVAS_WIDTH / 2, 230, 20, '#f0a000', 'center');

    this.drawText('PRESS ENTER TO START', CANVAS_WIDTH / 2, 340, 10, '#888', 'center');

    this.drawText('CONTROLS', CANVAS_WIDTH / 2, 420, 10, '#666', 'center');
    const controls = [
      'ARROWS / WASD - MOVE',
      'UP / W / X - ROTATE',
      'SPACE - HARD DROP',
      'C - HOLD',
      'ESC / P - PAUSE',
    ];
    controls.forEach((line, i) => {
      this.drawText(line, CANVAS_WIDTH / 2, 445 + i * 20, 8, '#555', 'center');
    });

    this.drawScanlines();
  }

  drawPause() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const pulse = 0.6 + Math.sin(this.frameCount * 0.08) * 0.4;
    ctx.globalAlpha = pulse;
    this.drawText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20, 24, '#f0f000', 'center');
    ctx.globalAlpha = 1;

    this.drawText('PRESS ESC TO RESUME', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30, 9, '#888', 'center');
  }

  drawGameOver(score, level, lines) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.drawText('GAME OVER', CANVAS_WIDTH / 2, 200, 24, '#f00000', 'center');

    this.drawText(`SCORE: ${score}`, CANVAS_WIDTH / 2, 280, 12, '#fff', 'center');
    this.drawText(`LEVEL: ${level}`, CANVAS_WIDTH / 2, 310, 12, '#00f0f0', 'center');
    this.drawText(`LINES: ${lines}`, CANVAS_WIDTH / 2, 340, 12, '#f0a000', 'center');

    const pulse = 0.5 + Math.sin(this.frameCount * 0.06) * 0.5;
    ctx.globalAlpha = pulse;
    this.drawText('PRESS ENTER TO RESTART', CANVAS_WIDTH / 2, 420, 10, '#888', 'center');
    ctx.globalAlpha = 1;

    this.drawScanlines();
  }

  render(game, dt) {
    this.frameCount++;
    if (this.shakeTimer > 0) this.shakeTimer -= dt;
    if (this.lineClearFlash > 0) this.lineClearFlash -= dt;
    this.updateParticles(dt);

    const ctx = this.ctx;
    ctx.save();

    if (this.shakeTimer > 0) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity;
      const sy = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(sx, sy);
    }

    ctx.fillStyle = '#0a0a1e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.drawStars(dt);

    if (game.state === STATES.MENU) {
      this.drawMenu();
      ctx.restore();
      return;
    }

    this.drawBoardBorder();
    this.drawGrid();
    this.drawBoard(game.board);

    if (game.currentPiece && game.state !== STATES.LINE_CLEAR) {
      this.drawGhost(game.currentPiece, game.board);
      this.drawPiece(game.currentPiece);
    }

    this.drawParticles();

    const panelX = BOARD_X + COLS * BLOCK_SIZE + 20;
    const panelW = 130;

    this.drawPanel(panelX, BOARD_Y, panelW, 95, 'HOLD');
    if (game.holdPiece) {
      this.drawHoldPiece(game.holdPiece, panelX, BOARD_Y);
    }

    this.drawPanel(panelX, BOARD_Y + 110, panelW, 180, 'NEXT');
    this.drawPreviewPieces(game.bag.peek(3), panelX, BOARD_Y + 110);

    this.drawPanel(panelX, BOARD_Y + 305, panelW, 120, 'INFO');
    this.drawText(`${game.scoring.score}`, panelX + 10, BOARD_Y + 330, 12, '#fff');
    this.drawText('SCORE', panelX + 10, BOARD_Y + 348, 7, '#888');
    this.drawText(`LVL ${game.scoring.level}`, panelX + 10, BOARD_Y + 370, 10, '#00f0f0');
    this.drawText(`${game.scoring.lines} LINES`, panelX + 10, BOARD_Y + 390, 8, '#f0a000');

    const soundIcon = game.audio.enabled ? 'ON' : 'OFF';
    this.drawText(`SND:${soundIcon}`, panelX + 10, BOARD_Y + 440, 8, '#666');

    if (game.state === STATES.PAUSED) {
      this.drawPause();
    } else if (game.state === STATES.GAME_OVER) {
      this.drawGameOver(game.scoring.score, game.scoring.level, game.scoring.lines);
    }

    this.drawScanlines();
    ctx.restore();
  }
}
