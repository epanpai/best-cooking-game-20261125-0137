// Dapur Kilat — deterministic screenshot scenes for ?shot=.
// Each scene builds a fixed world state (no play needed) so the four
// screenshots show the game at its best: title, mid-game, rush, serve.

import { makeWorld, startShift } from './world.js';
import { dishByName } from './recipes.js';

function order(world, dish, left, maxLeft) {
  world.orders.push({ id: 100 + world.orders.length, dish, left, maxLeft, born: 0 });
}

export function stageShot(world, name, seed) {
  const rngWorld = makeWorld(seed);
  Object.assign(world, rngWorld);
  world.screen = 'playing';
  world.time = 42;
  world.shiftLeft = 96;
  world.score = 0;
  world.served = 0;
  world.expired = 0;
  world.hearts = 3;
  world.combo = 0;
  world.bestCombo = 0;
  world.carry = [];
  world.plate = [];
  world.orders = [];
  world.board = null;
  world.wok = null;
  world.particles = [];
  world.floats = [];
  world.flash = 0;
  world.shake = 0;
  world.rush = false;
  world.rushAnnounced = false;

  if (name === 'start') {
    world.screen = 'title';
    world.shiftLeft = 150;
    world.time = 3;
    return;
  }

  if (name === 'play') {
    // Mid-game: two orders, one dish mid-assembly on the plate, the chef
    // carrying a cooked egg, a chilli being chopped on the board.
    world.score = 185;
    world.served = 3;
    world.combo = 2;
    world.shiftLeft = 96;
    order(world, 'Nasi Goreng', 34, 50);
    order(world, 'Mie Goreng', 22, 50);
    world.plate = ['nasi', 'telur'];
    world.carry = [{ id: 'cabai', state: 'done' }];
    world.board = { item: { id: 'sayur', state: 'raw' }, left: 0.5, max: 1.1 };
    world.chef = { x: 620, y: 480, dir: -1, moving: false, target: null, autoAct: null };
    world.floats = [{ x: 640, y: 300, text: '+Rp85', color: '#ffc93c', life: 0.3, max: 1.4 }];
    return;
  }

  if (name === 'rush') {
    // Service rush: four orders, timers low, the wok cooking, chef hurrying.
    world.score = 640;
    world.served = 10;
    world.combo = 4;
    world.bestCombo = 4;
    world.shiftLeft = 24;
    world.rush = true;
    world.rushAnnounced = true;
    order(world, 'Soto Ayam', 9, 40);
    order(world, 'Ayam Geprek', 14, 50);
    order(world, 'Nasi Goreng', 21, 50);
    order(world, 'Telur Dadar', 6, 50);
    world.plate = ['ayam'];
    world.carry = [{ id: 'sayur', state: 'done' }, { id: 'nasi', state: 'done' }];
    world.wok = { item: { id: 'telur', state: 'raw' }, left: 0.9, max: 2.4 };
    world.chef = { x: 880, y: 380, dir: 1, moving: true, target: null, autoAct: null };
    world.floats = [{ x: 640, y: 240, text: 'JAM RAMAI!', color: '#ff9d2e', life: 0.2, max: 1.4 }];
    return;
  }

  if (name === 'serve') {
    // A plate ready to serve: complete Nasi Goreng on the plate, chef
    // carrying it to the window, a served coin float above the window.
    world.score = 420;
    world.served = 7;
    world.combo = 3;
    world.shiftLeft = 71;
    order(world, 'Nasi Goreng', 38, 50);
    order(world, 'Mie Goreng', 30, 50);
    world.plate = [];
    world.carry = [{ id: 'plate:Nasi Goreng', state: 'done' }];
    world.chef = { x: 1060, y: 500, dir: 1, moving: true, target: null, autoAct: null };
    world.floats = [
      { x: 1120, y: 540, text: '+Rp120', color: '#ffc93c', life: 0.2, max: 1.4 },
      { x: 1120, y: 514, text: 'Combo x1.50!', color: '#7be495', life: 0.2, max: 1.4 },
    ];
    return;
  }

  // Unknown shot: plain mid-game.
  startShift(world);
}

export function shotNames() {
  return ['start', 'play', 'rush', 'serve'];
}
