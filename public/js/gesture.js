class GestureController {
  constructor(game) {
    this.game = game;
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    
    this.hands = null;
    this.camera = null;
    this.enabled = false;
    this.modelLoaded = false;
    
    // Track gesture states for edge-triggering
    this.lastGestureState = {
      rotate: false,
      hardDrop: false,
      hold: false
    };

    // Define boundary zones in raw landmark coordinates (x: 0..1, y: 0..1)
    // Remember: x is 0 on camera-left (which is screen-right mirrored), and 1 on camera-right (screen-left)
    this.zones = {
      leftThreshold: 0.62,   // raw x > 0.62 triggers Move Left
      rightThreshold: 0.38,  // raw x < 0.38 triggers Move Right
      dropThreshold: 0.68    // raw y > 0.68 triggers Soft Drop
    };

    this.toggleButton = null;
    this.statusEl = null;
    this.gestureValEl = null;
    this.placeholderEl = null;
    this.panelEl = null;
  }

  init() {
    this.video = document.getElementById('webcam');
    this.canvas = document.getElementById('webcam-overlay');
    this.ctx = this.canvas.getContext('2d');
    
    this.toggleButton = document.getElementById('camera-toggle-btn');
    this.statusEl = document.getElementById('camera-status');
    this.gestureValEl = document.getElementById('detected-gesture-val');
    this.placeholderEl = document.getElementById('camera-placeholder');
    this.panelEl = document.getElementById('camera-panel');

    // Set canvas resolution to match video aspect ratio
    this.canvas.width = 320;
    this.canvas.height = 240;

    this.toggleButton.addEventListener('click', () => this.toggle());
  }

  async toggle() {
    if (this.enabled) {
      this.stop();
    } else {
      await this.start();
    }
  }

  async start() {
    this.enabled = true;
    this.toggleButton.textContent = 'STOPPING...';
    this.toggleButton.disabled = true;

    this.updatePlaceholder('🎥 INITIALIZING...', 'Loading tracking models...');
    this.updateStatus('LOADING', 'status-yellow');

    try {
      if (!this.hands) {
        this.hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        this.hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });

        this.hands.onResults((results) => this.onResults(results));
        this.modelLoaded = true;
      }

      // Start webcam stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, frameRate: { ideal: 30 } }
      });
      this.video.srcObject = stream;
      await this.video.play();

      if (!this.camera) {
        this.camera = new Camera(this.video, {
          onFrame: async () => {
            if (this.enabled) {
              await this.hands.send({ image: this.video });
            }
          },
          width: 320,
          height: 240
        });
      }

      await this.camera.start();

      this.placeholderEl.classList.remove('placeholder-active');
      this.panelEl.classList.add('panel-active');
      this.updateStatus('ACTIVE', 'status-green');
      this.toggleButton.textContent = 'DISABLE CAMERA';
      this.toggleButton.disabled = false;
    } catch (err) {
      console.error('Failed to start camera control:', err);
      this.updatePlaceholder('❌ ERROR', err.name === 'NotAllowedError' ? 'Webcam permission denied' : 'Could not access webcam');
      this.updateStatus('ERROR', 'status-red');
      this.toggleButton.textContent = 'ENABLE CAMERA';
      this.toggleButton.disabled = false;
      this.enabled = false;
      this.stopTracks();
    }
  }

  stop() {
    this.enabled = false;
    this.toggleButton.textContent = 'STARTING...';
    this.toggleButton.disabled = true;

    if (this.camera) {
      this.camera.stop();
    }

    this.stopTracks();
    this.clearContinuousInputs();
    this.updateDetectedGesture('-');

    // Reset overlay canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.placeholderEl.classList.add('placeholder-active');
    this.panelEl.classList.remove('panel-active');
    this.updatePlaceholder('🎥 CAMERA DISCONNECTED', 'Click ENABLE CAMERA to start');
    this.updateStatus('OFFLINE', 'status-red');
    this.toggleButton.textContent = 'ENABLE CAMERA';
    this.toggleButton.disabled = false;
  }

  stopTracks() {
    if (this.video && this.video.srcObject) {
      const stream = this.video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      this.video.srcObject = null;
    }
  }

  updateStatus(text, className) {
    this.statusEl.textContent = text;
    this.statusEl.className = className;
  }

  updatePlaceholder(title, subtitle) {
    const titleEl = this.placeholderEl.querySelector('.placeholder-text');
    const subtitleEl = this.placeholderEl.querySelector('.placeholder-subtext');
    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
  }

  updateDetectedGesture(text) {
    this.gestureValEl.textContent = text;
  }

  setKeyState(action, isPressed) {
    if (!this.game || !this.game.input) return;

    if (isPressed) {
      if (!this.game.input.keys[action]) {
        this.game.input.justPressed[action] = true;
        this.game.input._emit(action);
        // Set DAS (Delayed Auto Shift) timers
        this.game.input.dasTimers[action] = DAS_DELAY;
        this.game.input.dasActive[action] = false;
        this.game.input.keys[action] = true;
      }
    } else {
      if (this.game.input.keys[action]) {
        this.game.input.keys[action] = false;
        this.game.input.dasTimers[action] = 0;
        this.game.input.dasActive[action] = false;
      }
    }
  }

  triggerAction(action) {
    if (!this.game || !this.game.input) return;
    this.game.input._emit(action);
  }

  clearContinuousInputs() {
    this.setKeyState('left', false);
    this.setKeyState('right', false);
    this.setKeyState('softDrop', false);
  }

  onResults(results) {
    if (!this.enabled) return;

    // Check if any modal is open
    const modalsOpen = document.getElementById('gameover-modal').style.display === 'flex' ||
                       document.getElementById('auth-modal').style.display === 'flex' ||
                       document.getElementById('leaderboard-modal').style.display === 'flex';

    if (modalsOpen) {
      this.clearContinuousInputs();
      this.updateDetectedGesture('PAUSED (MODAL)');
      this.drawOverlay(null);
      return;
    }

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      this.updateDetectedGesture('NO HAND');
      this.clearContinuousInputs();
      this.drawOverlay(null);
      return;
    }

    const landmarks = results.multiHandLandmarks[0];

    // Compute hand center as average of WRIST (0), INDEX_FINGER_MCP (5), and PINKY_FINGER_MCP (17)
    const handX = (landmarks[0].x + landmarks[5].x + landmarks[17].x) / 3;
    const handY = (landmarks[0].y + landmarks[5].y + landmarks[17].y) / 3;

    // Detect Active Zones
    // Standard coordinates: x=0 is camera-left, x=1 is camera-right
    // When mirrored, camera-right (x -> 1) is screen-left, camera-left (x -> 0) is screen-right.
    let zone = 'neutral';
    if (handX > this.zones.leftThreshold) {
      zone = 'left';
    } else if (handX < this.zones.rightThreshold) {
      zone = 'right';
    } else if (handY > this.zones.dropThreshold) {
      zone = 'drop';
    }

    // Classify finger poses
    // 8: Index Tip, 6: Index PIP
    const isIndexExtended = landmarks[8].y < landmarks[6].y;
    // 12: Middle Tip, 10: Middle PIP
    const isMiddleExtended = landmarks[12].y < landmarks[10].y;
    // 16: Ring Tip, 14: Ring PIP
    const isRingExtended = landmarks[16].y < landmarks[14].y;
    // 20: Pinky Tip, 18: Pinky PIP
    const isPinkyExtended = landmarks[20].y < landmarks[18].y;

    const isFist = !isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended;
    const isOpenPalm = isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended;
    
    // Rotate: Index extended, but Ring and Pinky folded.
    const isRotate = isIndexExtended && !isRingExtended && !isPinkyExtended;

    // Control game only if state is PLAYING
    if (this.game.state === STATES.PLAYING) {
      // Continuous movements
      this.setKeyState('left', zone === 'left');
      this.setKeyState('right', zone === 'right');
      this.setKeyState('softDrop', zone === 'drop');

      // Discrete Action 1: Rotate CW
      if (isRotate && !this.lastGestureState.rotate) {
        this.triggerAction('rotateCW');
        this.lastGestureState.rotate = true;
      } else if (!isRotate) {
        this.lastGestureState.rotate = false;
      }

      // Discrete Action 2: Hard Drop
      if (isFist && !this.lastGestureState.hardDrop) {
        this.triggerAction('hardDrop');
        this.lastGestureState.hardDrop = true;
      } else if (!isFist) {
        this.lastGestureState.hardDrop = false;
      }

      // Discrete Action 3: Hold Piece (only in Neutral Zone to avoid accidental triggers)
      if (isOpenPalm && zone === 'neutral' && !this.lastGestureState.hold) {
        this.triggerAction('hold');
        this.lastGestureState.hold = true;
      } else if (!isOpenPalm) {
        this.lastGestureState.hold = false;
      }
    } else {
      this.clearContinuousInputs();
    }

    // Update gesture HUD
    let gestureHUD = 'NEUTRAL';
    if (zone === 'left') gestureHUD = 'MOVE LEFT';
    else if (zone === 'right') gestureHUD = 'MOVE RIGHT';
    else if (zone === 'drop') gestureHUD = 'SOFT DROP';

    if (isFist) gestureHUD = '✊ HARD DROP';
    else if (isRotate) gestureHUD = '🔄 ROTATE';
    else if (isOpenPalm && zone === 'neutral') gestureHUD = '✋ HOLD PIECE';

    this.updateDetectedGesture(gestureHUD);

    // Draw video overlays
    this.drawOverlay(landmarks, zone, { isFist, isRotate, isOpenPalm });
  }

  drawOverlay(landmarks, activeZone, poses) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    this.ctx.clearRect(0, 0, width, height);

    // 1. Draw Zones (in raw coordinate space - will be mirrored by CSS)
    // Left boundary line (corresponds to screen-left since raw x > leftThreshold is camera-right)
    const rawLeftX = this.zones.leftThreshold * width;
    const rawRightX = this.zones.rightThreshold * width;
    const rawDropY = this.zones.dropThreshold * height;

    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([4, 4]);

    // Draw Left Zone boundary
    this.ctx.strokeStyle = activeZone === 'left' ? '#ff00ff' : 'rgba(255, 255, 255, 0.25)';
    this.ctx.beginPath();
    this.ctx.moveTo(rawLeftX, 0);
    this.ctx.lineTo(rawLeftX, rawDropY);
    this.ctx.stroke();

    // Draw Right Zone boundary
    this.ctx.strokeStyle = activeZone === 'right' ? '#ff00ff' : 'rgba(255, 255, 255, 0.25)';
    this.ctx.beginPath();
    this.ctx.moveTo(rawRightX, 0);
    this.ctx.lineTo(rawRightX, rawDropY);
    this.ctx.stroke();

    // Draw Bottom Drop Zone boundary
    this.ctx.strokeStyle = activeZone === 'drop' ? '#ff00ff' : 'rgba(255, 255, 255, 0.25)';
    this.ctx.beginPath();
    this.ctx.moveTo(0, rawDropY);
    this.ctx.lineTo(width, rawDropY);
    this.ctx.stroke();

    this.ctx.setLineDash([]); // Reset line dash

    // Fill active zone with translucent retro colors
    if (activeZone === 'left') {
      this.ctx.fillStyle = 'rgba(255, 0, 255, 0.08)';
      this.ctx.fillRect(rawLeftX, 0, width - rawLeftX, rawDropY);
    } else if (activeZone === 'right') {
      this.ctx.fillStyle = 'rgba(255, 0, 255, 0.08)';
      this.ctx.fillRect(0, 0, rawRightX, rawDropY);
    } else if (activeZone === 'drop') {
      this.ctx.fillStyle = 'rgba(255, 0, 255, 0.08)';
      this.ctx.fillRect(0, rawDropY, width, height - rawDropY);
    }

    // Add labels to the zones
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.font = '8px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    
    // Draw text labels
    // Since screen is mirrored, raw leftX (large value) is screen-left.
    this.ctx.fillText('LEFT', (width + rawLeftX) / 2, 20);
    this.ctx.fillText('RIGHT', rawRightX / 2, 20);
    this.ctx.fillText('DROP', width / 2, (height + rawDropY) / 2);
    this.ctx.fillText('NEUTRAL', (rawLeftX + rawRightX) / 2, 20);

    // 2. Draw Hand Landmarks
    if (!landmarks) return;

    // Connect joints to draw the hand skeleton
    const connections = [
      // Thumb
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index finger
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Middle finger
      [9, 10], [10, 11], [11, 12],
      // Ring finger
      [13, 14], [14, 15], [15, 16],
      // Pinky
      [0, 17], [17, 18], [18, 19], [19, 20],
      // Palm base connections
      [5, 9], [9, 13], [13, 17]
    ];

    // Color code skeletal hand based on state
    let handColor = '#00f0f0'; // Default: cyan
    if (poses && (poses.isFist || poses.isRotate || (poses.isOpenPalm && activeZone === 'neutral'))) {
      handColor = '#00ff66'; // Action trigger: glowing green
    } else if (activeZone !== 'neutral') {
      handColor = '#ff00ff'; // Moving/Continuous: neon magenta
    }

    // Draw connection lines
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = handColor;
    for (const [i, j] of connections) {
      this.ctx.beginPath();
      this.ctx.moveTo(landmarks[i].x * width, landmarks[i].y * height);
      this.ctx.lineTo(landmarks[j].x * width, landmarks[j].y * height);
      this.ctx.stroke();
    }

    // Draw joint circles
    for (let i = 0; i < landmarks.length; i++) {
      const cx = landmarks[i].x * width;
      const cy = landmarks[i].y * height;
      
      this.ctx.fillStyle = i % 4 === 0 && i !== 0 ? '#ff00ff' : '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
      this.ctx.fill();

      // Glowing dot for fingertip or wrist
      if (i === 4 || i === 8 || i === 12 || i === 16 || i === 20 || i === 0) {
        this.ctx.fillStyle = handColor;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
        this.ctx.fill();
      }
    }
  }
}
