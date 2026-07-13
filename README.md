# TETRIS GEN

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CodeQL](https://github.com/<owner>/tetris-gen/actions/workflows/codeql.yml/badge.svg)](https://github.com/<owner>/tetris-gen/actions/workflows/codeql.yml)

A professional, retro-styled Tetris web game with user accounts and global leaderboards. Built with vanilla JavaScript, Rust (Actix-web), and PostgreSQL. Docker-compatible for instant play anywhere.

## Quick Start

### Docker (Recommended)

```bash
docker-compose up --build
```

Open **http://localhost:4200** in your browser.

### Without Docker (Frontend Only)

Open `public/index.html` in any modern browser. Scores and auth won't work without the backend.

## Controls

| Key | Action |
|-----|--------|
| ← → / A D | Move left/right |
| ↓ / S | Soft drop |
| ↑ / W / X | Rotate clockwise |
| Space | Hard drop |
| C | Hold piece |
| Z | Rotate counter-clockwise |
| Esc / P | Pause |
| M | Toggle sound |
| Enter | Start / Restart |

## Features

### Gameplay
- **SRS Rotation System** — Full Super Rotation System with wall kicks
- **7-Bag Randomizer** — Fair piece distribution, no drought streaks
- **Ghost Piece** — Translucent preview of where the piece will land
- **Hold Piece** — Swap current piece with held piece (once per drop)
- **Next Preview** — See the next 3 upcoming pieces
- **Lock Delay** — Brief pause before piece locks, with move reset
- **DAS** — Delayed Auto Shift for smooth left/right movement
- **Scoring** — Classic Tetris scoring (Single/Double/Triple/Tetris)
- **20 Levels** — Speed increases every 10 lines cleared

### Audio & Visual
- **Sound Effects** — Retro sounds generated via Web Audio API
- **CRT Effect** — Scanline overlay with neon glow styling
- **Line Clear Animation** — Flashing rows with particle effects
- **Screen Shake** — Subtle feedback on hard drops
- **Pause on Blur** — Auto-pauses when switching tabs

### Online Features
- **User Accounts** — Register and login with username/password (Argon2 hashed)
- **Global Leaderboard** — Top 10 scores across all players
- **Personal Score History** — View your last 20 games
- **Live Rank Display** — Your global rank shown on game over
- **Session Persistence** — Cookie-based sessions via actix-session
- **Self-Destruct** — Nuclear option to wipe all data and tear down Docker

## Scoring

| Lines | Points (× Level) |
|-------|-------------------|
| Single | 100 |
| Double | 300 |
| Triple | 500 |
| Tetris | 800 |
| Combo | +50 × combo × level |
| Soft Drop | +1 per cell |
| Hard Drop | +2 per cell |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5 Canvas, Vanilla JavaScript |
| Audio | Web Audio API |
| Backend | Rust + Actix-web 4 |
| Database | PostgreSQL 18 |
| Auth | Argon2 + actix-session (cookie store) |
| Server | Nginx:Alpine |
| Container | Docker Compose (3 services) |
| Security | GitHub CodeQL (JS + Rust) |

## Project Structure

```
tetris-gen/
├── public/
│   ├── index.html              # Main page + modals
│   ├── css/style.css           # CRT retro + modal styles
│   └── js/
│       ├── constants.js        # Game configuration
│       ├── piece.js            # Tetromino shapes & randomizer
│       ├── board.js            # Grid logic & collision
│       ├── scoring.js          # Score, levels, speed
│       ├── audio.js            # Web Audio API sounds
│       ├── input.js            # Keyboard with DAS
│       ├── renderer.js         # Canvas rendering
│       ├── game.js             # Game loop & state machine
│       ├── main.js             # Entry point + auth integration
│       ├── api.js              # Backend API client
│       ├── auth.js             # Login/register modal UI
│       └── leaderboard.js      # Leaderboard + personal scores
├── server/
│   ├── Cargo.toml              # Rust dependencies
│   ├── src/
│   │   ├── main.rs             # Entry point, middleware, routes
│   │   ├── config.rs           # Environment config
│   │   ├── error.rs            # Error types
│   │   ├── models.rs           # Data models
│   │   ├── middleware.rs        # Session helpers
│   │   └── routes/
│   │       ├── mod.rs
│   │       ├── auth.rs         # Register/login/logout/me
│   │       ├── scores.rs       # Submit/leaderboard/personal/rank
│   │       └── self_destruct.rs # Nuclear database wipe
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   └── 002_create_scores.sql
│   └── Dockerfile              # Multi-stage Rust build
├── Dockerfile                  # Nginx frontend container
├── docker-compose.yml          # 3-service stack
├── self-destruct.sh            # Nuclear cleanup script
├── nginx.conf                  # Static files + API proxy
├── .github/workflows/
│   └── codeql.yml              # CodeQL security analysis (JS + Rust)
├── LICENSE                     # MIT License
└── tetris.py                   # Original Python version
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/logout` | Yes | Logout |
| GET | `/api/auth/me` | No | Current user |
| POST | `/api/scores` | Yes | Submit score |
| GET | `/api/scores/leaderboard` | No | Top 10 global |
| GET | `/api/scores/personal` | Yes | User's history |
| GET | `/api/scores/rank` | Yes | User's global rank |
| POST | `/api/self-destruct` | Key | Wipe all database tables |

## Docker Services

| Service | Image | Purpose |
|---------|-------|---------|
| nginx | nginx:alpine | Static frontend + API proxy |
| api | Rust 1.88 (multi-stage build) | Actix-web backend |
| db | postgres:18-alpine | PostgreSQL database |

## Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop all services
docker-compose down

# Stop and delete all data
docker-compose down -v

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build

# Self-destruct (nuclear option)
# Wipe database via API
curl -X POST http://localhost:4200/api/self-destruct \
  -H "Content-Type: application/json" \
  -d '{"key":"destroy"}'

# Full teardown: DB + containers + images + build cache
./self-destruct.sh
```

## Security

This project uses [GitHub CodeQL](https://codeql.github.com/) for automated security analysis. CodeQL runs on every push/PR to `main` and weekly on Monday, scanning for:

- **JavaScript/TypeScript** — XSS, prototype pollution, insecure dependencies
- **Rust** — SQL injection, cleartext storage, crypto misuse, unsafe URL usage

## Browser Support

Works on any modern browser with Canvas support:
- Chrome / Edge
- Firefox
- Safari

## License

This project is licensed under the [MIT License](LICENSE).
