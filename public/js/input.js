class Input {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this.dasTimers = {};
    this.dasActive = {};
    this.callbacks = {};
    this.enabled = true;

    this.keyMap = {
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'ArrowDown': 'softDrop',
      'ArrowUp': 'rotateCW',
      ' ': 'hardDrop',
      'c': 'hold',
      'C': 'hold',
      'z': 'rotateCCW',
      'Z': 'rotateCCW',
      'Escape': 'pause',
      'p': 'pause',
      'P': 'pause',
      'x': 'rotateCW',
      'X': 'rotateCW',
      'a': 'left',
      'A': 'left',
      'd': 'right',
      'D': 'right',
      's': 'softDrop',
      'S': 'softDrop',
      'w': 'rotateCW',
      'W': 'rotateCW',
    };

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  on(action, callback) {
    this.callbacks[action] = callback;
  }

  _emit(action) {
    if (this.callbacks[action]) this.callbacks[action]();
  }

  _onKeyDown(e) {
    if (!this.enabled) return;
    const action = this.keyMap[e.key];
    if (!action) return;
    e.preventDefault();

    if (!this.keys[action]) {
      this.justPressed[action] = true;
      this._emit(action);
      this.dasTimers[action] = DAS_DELAY;
      this.dasActive[action] = false;
    }
    this.keys[action] = true;
  }

  _onKeyUp(e) {
    const action = this.keyMap[e.key];
    if (!action) return;
    e.preventDefault();
    this.keys[action] = false;
    this.dasTimers[action] = 0;
    this.dasActive[action] = false;
  }

  clearJustPressed() {
    this.justPressed = {};
  }

  update(dt) {
    const dasActions = ['left', 'right', 'softDrop'];
    for (const action of dasActions) {
      if (!this.keys[action]) continue;
      this.dasTimers[action] -= dt;
      if (this.dasTimers[action] <= 0) {
        this.dasActive[action] = true;
        this.dasTimers[action] = DAS_REPEAT;
        this._emit(action);
      }
    }
  }

  isHeld(action) {
    return !!this.keys[action];
  }

  reset() {
    this.keys = {};
    this.justPressed = {};
    this.dasTimers = {};
    this.dasActive = {};
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
