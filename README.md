# TETRIS GEN

A professional, retro-styled Tetris web game with user accounts and global leaderboards. Built with vanilla JavaScript, Node.js, and PostgreSQL. Docker-compatible for instant play anywhere.

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
- **User Accounts** — Register and login with username/password (bcrypt hashed)
- **Global Leaderboard** — Top 10 scores across all players
- **Personal Score History** — View your last 20 games
- **Live Rank Display** — Your global rank shown on game over
- **Session Persistence** — Stay logged in for 7 days

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
| Backend | Node.js + Express |
| Database | PostgreSQL 18 |
| Auth | bcrypt + express-session |
| Server | Nginx:Alpine |
| Container | Docker Compose (3 services) |

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
│   ├── index.js                # Express app entry
│   ├── db.js                   # PostgreSQL connection pool
│   ├── auth.js                 # Register/login logic
│   ├── routes/
│   │   ├── auth.js             # Auth API routes
│   │   └── scores.js           # Score API routes
│   ├── package.json
│   └── Dockerfile
├── Dockerfile                  # Nginx frontend container
├── docker-compose.yml          # 3-service stack
├── nginx.conf                  # Static files + API proxy
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

## Docker Services

| Service | Image | Purpose |
|---------|-------|---------|
| nginx | nginx:alpine | Static frontend + API proxy |
| api | node:20-alpine | Express backend |
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
```

## Browser Support

Works on any modern browser with Canvas support:
- Chrome / Edge
- Firefox
- Safari
