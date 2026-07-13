class Leaderboard {
  constructor() {
    this.modal = document.getElementById('leaderboard-modal');
    this.tabBtns = this.modal.querySelectorAll('.tab-btn');
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    document.getElementById('leaderboard-close').addEventListener('click', () => {
      this.hide();
    });
  }

  async show(tab) {
    this.modal.style.display = 'flex';
    this.switchTab(tab || 'leaderboard');
  }

  hide() {
    this.modal.style.display = 'none';
  }

  async switchTab(tab) {
    this.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    document.getElementById('tab-leaderboard').style.display = tab === 'leaderboard' ? 'block' : 'none';
    document.getElementById('tab-personal').style.display = tab === 'personal' ? 'block' : 'none';

    if (tab === 'leaderboard') await this.loadLeaderboard();
    if (tab === 'personal') await this.loadPersonal();
  }

  async loadLeaderboard() {
    const container = document.getElementById('leaderboard-list');
    container.innerHTML = '<div class="loading">Loading...</div>';

    try {
      const data = await API.leaderboard();
      if (data.leaderboard.length === 0) {
        container.innerHTML = '<div class="empty">No scores yet. Be the first!</div>';
        return;
      }

      container.innerHTML = data.leaderboard.map((entry, i) => `
        <div class="lb-row ${i < 3 ? 'top-' + (i + 1) : ''}">
          <span class="lb-rank">${i + 1}</span>
          <span class="lb-name">${this.esc(entry.username)}</span>
          <span class="lb-score">${entry.score.toLocaleString()}</span>
          <span class="lb-info">L${entry.level} · ${entry.lines}L</span>
        </div>
      `).join('');
    } catch (e) {
      container.innerHTML = '<div class="empty">Failed to load leaderboard</div>';
    }
  }

  async loadPersonal() {
    const container = document.getElementById('personal-list');
    container.innerHTML = '<div class="loading">Loading...</div>';

    try {
      const data = await API.personalScores();
      if (data.scores.length === 0) {
        container.innerHTML = '<div class="empty">No scores yet. Play a game!</div>';
        return;
      }

      container.innerHTML = data.scores.map((entry) => {
        const date = new Date(entry.created_at).toLocaleDateString();
        return `
          <div class="lb-row">
            <span class="lb-score">${entry.score.toLocaleString()}</span>
            <span class="lb-info">L${entry.level} · ${entry.lines}L · ${date}</span>
          </div>
        `;
      }).join('');
    } catch (e) {
      container.innerHTML = '<div class="empty">Not logged in or failed to load</div>';
    }
  }

  esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
