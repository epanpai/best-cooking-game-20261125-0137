// Dapur Kilat — shared constants: canvas size, palette, timings and layout.
// One clear job: every number the rest of the game agrees on lives here.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const SHIFT_SECONDS = 150;
export const MAX_HEARTS = 3;
export const CARRY_MAX = 3;
export const MAX_ORDERS = 4;
export const ORDER_PATIENCE = 50;
export const CHOP_SECONDS = 1.1;
export const COOK_SECONDS = 2.4;
export const RUSH_AT = 30; // last seconds of the shift: JAM RAMAI

export const CHEF_SPEED = 250; // px per second
export const CHEF_RADIUS = 20;
export const INTERACT_DIST = 78;

// Kitchen floor area (below the order board).
export const FLOOR = { x: 24, y: 148, w: 1232, h: 548 };

export const PALETTE = {
  floorA: '#c98f4e',
  floorB: '#bd8342',
  wall: '#7c4a21',
  counterTop: '#8a5a2b',
  counterFront: '#6e4520',
  counterEdge: '#a9713a',
  steel: '#b9c0c7',
  steelDark: '#8d979f',
  board: '#e8c890',
  wok: '#3a3f45',
  flame: '#ff9d2e',
  window: '#f4e3c2',
  plate: '#fdf6e3',
  ink: '#2b1a0e',
  cream: '#fff3d6',
  red: '#d93b2b',
  green: '#3f9e4d',
  gold: '#ffc93c',
  blue: '#3d7ea6',
};

// Station rectangles (x, y, w, h) in canvas space.
export const STATIONS = {
  // Ingredient crates along the left wall.
  crates: [
    { id: 'nasi', label: 'Nasi', x: 36, y: 170, w: 108, h: 64 },
    { id: 'mie', label: 'Mie', x: 36, y: 246, w: 108, h: 64 },
    { id: 'ayam', label: 'Ayam', x: 36, y: 322, w: 108, h: 64 },
    { id: 'telur', label: 'Telur', x: 36, y: 398, w: 108, h: 64 },
    { id: 'sayur', label: 'Sayur', x: 36, y: 474, w: 108, h: 64 },
    { id: 'cabai', label: 'Cabai', x: 36, y: 550, w: 108, h: 64 },
  ],
  board: { id: 'board', label: 'Talenan', x: 300, y: 168, w: 220, h: 84 },
  wok: { id: 'wok', label: 'Wajan', x: 760, y: 168, w: 220, h: 84 },
  plate: { id: 'plate', label: 'Meja Plating', x: 470, y: 580, w: 300, h: 92 },
  window: { id: 'window', label: 'Jendela Saji', x: 1010, y: 580, w: 220, h: 92 },
};

export const CHEF_START = { x: 640, y: 440 };
