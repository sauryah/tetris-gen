const API = {
  async request(method, url, body) {
    const opts = {
      method,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json();
    if (!res.ok) throw { status: res.status, message: data.error || 'Request failed' };
    return data;
  },

  async register(username, password) {
    return this.request('POST', '/api/auth/register', { username, password });
  },

  async login(username, password) {
    return this.request('POST', '/api/auth/login', { username, password });
  },

  async logout() {
    return this.request('POST', '/api/auth/logout');
  },

  async me() {
    return this.request('GET', '/api/auth/me');
  },

  async submitScore(score, level, lines) {
    return this.request('POST', '/api/scores', { score, level, lines });
  },

  async leaderboard() {
    return this.request('GET', '/api/scores/leaderboard');
  },

  async personalScores() {
    return this.request('GET', '/api/scores/personal');
  },

  async rank() {
    return this.request('GET', '/api/scores/rank');
  },
};
