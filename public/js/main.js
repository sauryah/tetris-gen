(function () {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const game = new Game(canvas);
  const auth = new Auth();
  const leaderboard = new Leaderboard();
  let lastTime = 0;

  const gameoverModal = document.getElementById('gameover-modal');
  const gameoverScore = document.getElementById('gameover-score');
  const gameoverRank = document.getElementById('gameover-rank');

  game.onGameOver = async (score, level, lines) => {
    gameoverScore.innerHTML = `<span class="label">SCORE</span>${score.toLocaleString()}`;
    gameoverRank.style.display = 'none';

    if (auth.user) {
      try {
        const data = await API.submitScore(score, level, lines);
        gameoverRank.style.display = 'block';
        gameoverRank.innerHTML = `<span class="label">RANK</span>#${data.rank}`;
      } catch (e) {
        console.error('Score submit failed:', e);
      }
    }

    gameoverModal.style.display = 'flex';
  };

  document.getElementById('gameover-restart').addEventListener('click', () => {
    gameoverModal.style.display = 'none';
    game.start();
  });

  document.getElementById('gameover-menu').addEventListener('click', () => {
    gameoverModal.style.display = 'none';
    game.state = STATES.MENU;
  });

  document.getElementById('login-btn').addEventListener('click', () => {
    auth.show();
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    auth.logout();
  });

  document.getElementById('scores-btn').addEventListener('click', () => {
    leaderboard.show('leaderboard');
  });

  function gameLoop(timestamp) {
    const dt = lastTime ? Math.min(timestamp - lastTime, 100) : 16;
    lastTime = timestamp;

    game.update(dt);
    game.renderer.render(game, dt);

    requestAnimationFrame(gameLoop);
  }

  document.addEventListener('keydown', (e) => {
    const modalsOpen = gameoverModal.style.display === 'flex' ||
                       auth.modal.style.display === 'flex' ||
                       leaderboard.modal.style.display === 'flex';

    if (e.key === 'Enter' && !modalsOpen) {
      if (game.state === STATES.MENU) {
        game.start();
      }
    }

    if (e.key === 'm' || e.key === 'M') {
      game.audio.toggle();
    }

    if (e.key === 'Escape') {
      if (leaderboard.modal.style.display === 'flex') {
        leaderboard.hide();
      } else if (auth.modal.style.display === 'flex') {
        auth.hide();
      } else if (gameoverModal.style.display === 'flex') {
        gameoverModal.style.display = 'none';
        game.state = STATES.MENU;
      }
    }
  });

  canvas.addEventListener('click', () => {
    game.audio.init();
    game.audio.resume();
  });

  window.addEventListener('blur', () => {
    if (game.state === STATES.PLAYING) {
      game.state = STATES.PAUSED;
    }
  });

  auth.init();
  requestAnimationFrame(gameLoop);
})();
