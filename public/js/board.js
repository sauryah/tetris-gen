class Board {
  constructor() {
    this.grid = this.createGrid();
  }

  createGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  reset() {
    this.grid = this.createGrid();
  }

  isValid(piece, offsetX, offsetY, rotatedShape) {
    const shape = rotatedShape || piece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = piece.x + c + offsetX;
        const ny = piece.y + r + offsetY;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
        if (ny < 0) continue;
        if (this.grid[ny][nx] !== null) return false;
      }
    }
    return true;
  }

  lock(piece) {
    const cells = piece.getCells();
    for (const cell of cells) {
      if (cell.y < 0) return false;
      this.grid[cell.y][cell.x] = piece.color;
    }
    return true;
  }

  findFullLines() {
    const full = [];
    for (let r = 0; r < ROWS; r++) {
      if (this.grid[r].every(cell => cell !== null)) {
        full.push(r);
      }
    }
    return full;
  }

  clearLines(rows) {
    for (const r of rows.sort((a, b) => b - a)) {
      this.grid.splice(r, 1);
    }
    while (this.grid.length < ROWS) {
      this.grid.unshift(Array(COLS).fill(null));
    }
  }

  getGhostY(piece) {
    let ghostY = piece.y;
    while (this.isValid(piece, 0, ghostY - piece.y + 1)) {
      ghostY++;
    }
    return ghostY;
  }

  isGameOver() {
    return this.grid[0].some(cell => cell !== null) ||
           this.grid[1].some(cell => cell !== null);
  }
}
