class Audio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      this.enabled = false;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, duration, type, vol) {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.value = freq;
    gain.gain.value = vol || 0.15;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  }

  move() {
    this.playTone(200, 0.05, 'square', 0.08);
  }

  rotate() {
    this.playTone(400, 0.08, 'square', 0.1);
  }

  drop() {
    this.playTone(150, 0.15, 'triangle', 0.2);
  }

  lock() {
    this.playTone(100, 0.1, 'triangle', 0.15);
  }

  lineClear(count) {
    const base = 523;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.playTone(base + i * 100, 0.12, 'square', 0.12);
      }, i * 60);
    }
  }

  tetris() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 0.15, 'square', 0.15), i * 80);
    });
  }

  levelUp() {
    const notes = [440, 554, 659, 880];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 0.2, 'square', 0.12), i * 100);
    });
  }

  gameOver() {
    const notes = [392, 330, 262, 196];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 0.3, 'sawtooth', 0.1), i * 200);
    });
  }

  hold() {
    this.playTone(600, 0.06, 'sine', 0.1);
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}
