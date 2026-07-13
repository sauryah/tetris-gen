class Scoring {
  constructor() {
    this.reset();
  }

  reset() {
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.combo = -1;
  }

  addLineClear(count) {
    if (count === 0) {
      this.combo = -1;
      return 0;
    }
    this.combo++;
    const base = LINE_CLEAR_SCORE[count] || 0;
    const comboBonus = 50 * this.combo * this.level;
    const earned = base * this.level + comboBonus;
    this.score += earned;
    this.lines += count;
    const newLevel = Math.min(Math.floor(this.lines / LINES_PER_LEVEL) + 1, MAX_LEVEL);
    const leveledUp = newLevel > this.level;
    this.level = newLevel;
    return earned;
  }

  addSoftDrop(cells) {
    this.score += cells;
  }

  addHardDrop(cells) {
    this.score += cells * 2;
  }

  getGravity() {
    return GRAVITY_TABLE[Math.min(this.level - 1, GRAVITY_TABLE.length - 1)];
  }

  getLinesForNextLevel() {
    return this.level * LINES_PER_LEVEL;
  }
}
