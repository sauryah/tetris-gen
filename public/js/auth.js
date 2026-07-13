class Auth {
  constructor() {
    this.user = null;
    this.modal = document.getElementById('auth-modal');
    this.loginForm = document.getElementById('login-form');
    this.registerForm = document.getElementById('register-form');
    this.authError = document.getElementById('auth-error');
    this.authUsername = document.getElementById('auth-username');

    this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));

    document.getElementById('show-register').addEventListener('click', (e) => {
      e.preventDefault();
      this.loginForm.style.display = 'none';
      this.registerForm.style.display = 'block';
      this.clearError();
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
      e.preventDefault();
      this.registerForm.style.display = 'none';
      this.loginForm.style.display = 'block';
      this.clearError();
    });

    document.getElementById('auth-cancel').addEventListener('click', () => {
      this.hide();
    });

    document.getElementById('auth-skip').addEventListener('click', () => {
      this.hide();
    });
  }

  async init() {
    try {
      const data = await API.me();
      this.user = data.user;
      this.updateUI();
    } catch (e) {
      this.user = null;
    }
  }

  updateUI() {
    const usernameEl = document.getElementById('player-name');
    const logoutBtn = document.getElementById('logout-btn');
    const loginBtn = document.getElementById('login-btn');

    if (this.user) {
      usernameEl.textContent = this.user.username;
      usernameEl.style.display = 'inline';
      logoutBtn.style.display = 'inline';
      loginBtn.style.display = 'none';
    } else {
      usernameEl.style.display = 'none';
      logoutBtn.style.display = 'none';
      loginBtn.style.display = 'inline';
    }
  }

  show() {
    this.modal.style.display = 'flex';
    this.loginForm.style.display = 'block';
    this.registerForm.style.display = 'none';
    this.clearError();
    this.loginForm.querySelector('input[name="username"]').focus();
  }

  hide() {
    this.modal.style.display = 'none';
    this.clearError();
  }

  clearError() {
    this.authError.textContent = '';
    this.authError.style.display = 'none';
  }

  showError(msg) {
    this.authError.textContent = msg;
    this.authError.style.display = 'block';
  }

  async handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const username = form.username.value.trim();
    const password = form.password.value;

    try {
      const data = await API.login(username, password);
      this.user = data.user;
      this.updateUI();
      this.hide();
    } catch (err) {
      this.showError(err.message || 'Login failed');
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const username = form.username.value.trim();
    const password = form.password.value;

    try {
      const data = await API.register(username, password);
      this.user = data.user;
      this.updateUI();
      this.hide();
    } catch (err) {
      this.showError(err.message || 'Registration failed');
    }
  }

  async logout() {
    try {
      await API.logout();
    } catch (e) {}
    this.user = null;
    this.updateUI();
  }
}
