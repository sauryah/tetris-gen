const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const PREVIEW_BLOCK = 22;

const BOARD_X = 40;
const BOARD_Y = 40;

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 680;

const FPS = 60;

const LINES_PER_LEVEL = 10;
const MAX_LEVEL = 20;

const LOCK_DELAY = 500;
const LOCK_MOVE_LIMIT = 15;

const DAS_DELAY = 170;
const DAS_REPEAT = 50;

const SOFT_DROP_SPEED = 50;

const COLORS = {
  I: '#00f0f0',
  O: '#f0f000',
  S: '#00f000',
  Z: '#f00000',
  L: '#f0a000',
  J: '#0000f0',
  T: '#a000f0',
};

const GHOST_ALPHA = 0.25;

const LINE_CLEAR_SCORE = [0, 100, 300, 500, 800];

const GRAVITY_TABLE = [
  800, 720, 630, 550, 470, 380, 300, 220, 130, 100,
  80, 80, 80, 70, 70, 70, 50, 50, 50, 30,
];

const STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  LINE_CLEAR: 'LINE_CLEAR',
};
