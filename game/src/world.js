// Dapur Kilat — game state and update logic: the chef, orders, stations,
// chopping/cooking progress, serving, scoring, combos and the shift timer.
// Rendering lives in render.js; this file only decides what happens.

import {
  CHEF_SPEED, CHEF_RADIUS, INTERACT_DIST, SHIFT_SECONDS, MAX_HEARTS,
  CARRY_MAX, MAX_ORDERS, ORDER_PATIENCE, CHOP_SECONDS, COOK_SECONDS,
  RUSH_AT, STATIONS, CHEF_START,
} from './config.js';
import { DISHES, INGREDIENTS, freshItem, plateMatchesDish, dishByName } from './recipes.js';
import { makeRng, pick } from './random.js';

let orderSeq = 0;

export function makeWorld(seed) {
  const rng = makeRng(seed);
  return {
    rng,
    screen: 'title', // title | playing | paused | over
    time: 0,
    shiftLeft: SHIFT_SECONDS,
    score: 0,
    served: 0,
    expired: 0,
    hearts: MAX_HEARTS,
    combo: 0,
    bestCombo: 0,
    chef: { x: CHEF_START.x, y: CHEF_START.y, dir: 1, moving: false, target: null, autoAct: null },
    carry: [], // prepared/raw items the chef holds
    plate: [], // done item ids on the plating station
    orders: [], // { id, dish, left, maxLeft, born }
    spawnIn: 2.5,
    board: null, // { item, left, max } chopping in progress
    wok: null, // { item, left, max } cooking in progress
    particles: [], // { x, y, vx, vy, life, max, color, size }
    floats: [], // { x, y, text, color, life, max }
    flash: 0, // red flash on expiry, 0..1
    shake: 0,
    rush: false,
    rushAnnounced: false,
    muted: false,
    grade: null,
    stats: { chopped: 0, cooked: 0, wasted: 0 },
  };
}

export function startShift(world) {
  world.screen = 'playing';
  world.time = 0;
  world.shiftLeft = SHIFT_SECONDS;
  world.score = 0;
  world.served = 0;
  world.expired = 0;
  world.hearts = MAX_HEARTS;
  world.combo = 0;
  world.bestCombo = 0;
  world.carry = [];
  world.plate = [];
  world.orders = [];
  world.spawnIn = 2.5;
  world.board = null;
  world.wok = null;
  world.particles = [];
  world.floats = [];
  world.flash = 0;
  world.shake = 0;
  world.rush = false;
  world.rushAnnounced = false;
  world.grade = null;
  world.stats = { chopped: 0, cooked: 0, wasted: 0 };
  spawnOrder(world);
}

function spawnOrder(world) {
  if (world.orders.length >= MAX_ORDERS) return;
  const dish = pick(world.rng, DISHES);
  const patience = world.rush ? ORDER_PATIENCE * 0.8 : ORDER_PATIENCE;
  world.orders.push({
    id: ++orderSeq,
    dish: dish.name,
    left: patience,
    maxLeft: patience,
    born: world.time,
  });
}

function spawnInterval(world) {
  // Orders arrive faster as the shift goes on; faster still in the rush.
  const t = 1 - world.shiftLeft / SHIFT_SECONDS;
  let base = 13 - 5 * t;
  if (world.rush) base *= 0.55;
  return base;
}

export function stationAt(world, x, y) {
  // Nearest station whose rect (grown a little) contains the point, else null.
  const all = [
    ...STATIONS.crates.map((c) => ({ kind: 'crate', id: c.id, ...c })),
    { kind: 'board', ...STATIONS.board },
    { kind: 'wok', ...STATIONS.wok },
    { kind: 'plate', ...STATIONS.plate },
    { kind: 'window', ...STATIONS.window },
  ];
  for (const s of all) {
    if (x >= s.x - 6 && x <= s.x + s.w + 6 && y >= s.y - 6 && y <= s.y + s.h + 6) return s;
  }
  return null;
}

function stationCenter(s) {
  return { x: s.x + s.w / 2, y: s.y + s.h + 26 };
}

function nearestStationPoint(world, station) {
  // The spot the chef stands to use a station: just outside its front edge.
  const c = stationCenter(station);
  return { x: Math.max(60, Math.min(1220, c.x)), y: Math.max(180, Math.min(660, c.y)) };
}

export function requestInteract(world, station, audio) {
  // Called when the chef is already in range (E key) or arrives via click.
  const chef = world.chef;
  if (station.kind === 'crate') {
    if (world.carry.length >= CARRY_MAX) {
      addFloat(world, chef.x, chef.y - 34, 'Tangan penuh!', '#ff6b5e');
      return;
    }
    world.carry.push(freshItem(station.id));
    audio.pickup();
    burst(world, chef.x, chef.y - 10, INGREDIENTS[station.id].color, 6);
    return;
  }
  if (station.kind === 'board') {
    const i = world.carry.findIndex((it) => it.state === 'raw' && INGREDIENTS[it.id].prep === 'chop');
    if (world.board) {
      addFloat(world, chef.x, chef.y - 34, 'Talenan dipakai!', '#ff6b5e');
      return;
    }
    if (i === -1) {
      addFloat(world, chef.x, chef.y - 34, 'Butuh bahan mentah!', '#ff6b5e');
      return;
    }
    world.board = { item: world.carry.splice(i, 1)[0], left: CHOP_SECONDS, max: CHOP_SECONDS };
    audio.drop();
    return;
  }
  if (station.kind === 'wok') {
    const i = world.carry.findIndex((it) => it.state === 'raw' && INGREDIENTS[it.id].prep === 'cook');
    if (world.wok) {
      addFloat(world, chef.x, chef.y - 34, 'Wajan dipakai!', '#ff6b5e');
      return;
    }
    if (i === -1) {
      addFloat(world, chef.x, chef.y - 34, 'Butuh bahan mentah!', '#ff6b5e');
      return;
    }
    world.wok = { item: world.carry.splice(i, 1)[0], left: COOK_SECONDS, max: COOK_SECONDS };
    audio.drop();
    audio.sizzleStart();
    return;
  }
  if (station.kind === 'plate') {
    if (world.carry.length === 0) {
      // Empty hands: pick the finished plate up if it matches an order.
      const match = world.orders.find((o) => plateMatchesDish(world.plate, dishByName(o.dish)));
      if (match && world.plate.length > 0) {
        world.carry.push({ id: `plate:${match.dish}`, state: 'done' });
        world.plate = [];
        audio.plate();
      } else if (world.plate.length > 0) {
        addFloat(world, chef.x, chef.y - 34, 'Belum cocok pesanan!', '#ff6b5e');
      }
      return;
    }
    const i = world.carry.findIndex((it) => it.state === 'done' && !it.id.startsWith('plate:'));
    if (i === -1) {
      addFloat(world, chef.x, chef.y - 34, 'Bahan belum siap!', '#ff6b5e');
      return;
    }
    world.plate.push(world.carry.splice(i, 1)[0].id);
    audio.plate();
    burst(world, stationCenter(station).x, STATIONS.plate.y + 30, '#fff3d6', 5);
    return;
  }
  if (station.kind === 'window') {
    const i = world.carry.findIndex((it) => it.id.startsWith('plate:'));
    if (i === -1) {
      addFloat(world, chef.x, chef.y - 34, 'Bawa piring jadi ke sini!', '#ff6b5e');
      return;
    }
    const dishName = world.carry[i].id.slice('plate:'.length);
    const order = world.orders.find((o) => o.dish === dishName);
    if (!order) {
      addFloat(world, chef.x, chef.y - 34, 'Pesanannya sudah hilang!', '#ff6b5e');
      return;
    }
    world.carry.splice(i, 1);
    serveOrder(world, order, audio);
  }
}

function serveOrder(world, order, audio) {
  const dish = dishByName(order.dish);
  const tip = Math.round((order.left / order.maxLeft) * dish.price * 0.5);
  const mult = Math.min(3, 1 + (world.combo * 0.25));
  const earned = Math.round((dish.price + tip) * mult);
  world.score += earned;
  world.served += 1;
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.orders = world.orders.filter((o) => o.id !== order.id);
  const w = STATIONS.window;
  addFloat(world, w.x + w.w / 2, w.y - 14, `+Rp${earned}`, '#ffc93c');
  if (world.combo >= 2) addFloat(world, w.x + w.w / 2, w.y - 40, `Combo x${mult.toFixed(2).replace(/\.?0+$/, '')}!`, '#7be495');
  burst(world, w.x + w.w / 2, w.y + 20, '#ffc93c', 14);
  audio.serve();
}

function expireOrder(world, order, audio) {
  world.orders = world.orders.filter((o) => o.id !== order.id);
  world.expired += 1;
  world.hearts -= 1;
  world.combo = 0;
  world.flash = 1;
  world.shake = 10;
  addFloat(world, 640, 200, `${order.dish} hangus! -1 hati`, '#ff6b5e');
  audio.expire();
  if (world.hearts <= 0) endShift(world, audio);
}

function endShift(world, audio) {
  world.screen = 'over';
  world.grade = gradeFor(world);
  audio.sizzleStop();
  audio.win();
}

function gradeFor(world) {
  if (world.served >= 14 && world.expired === 0) return 'S';
  if (world.served >= 11) return 'A';
  if (world.served >= 8) return 'B';
  if (world.served >= 5) return 'C';
  return 'D';
}

function burst(world, x, y, color, n) {
  for (let i = 0; i < n; i += 1) {
    const a = world.rng() * Math.PI * 2;
    const sp = 40 + world.rng() * 90;
    world.particles.push({
      x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
      life: 0.5 + world.rng() * 0.4, max: 0.9,
      color, size: 2 + world.rng() * 3,
    });
  }
}

function addFloat(world, x, y, text, color) {
  world.floats.push({ x, y, text, color, life: 0, max: 1.4 });
}

export function clearPlate(world, audio) {
  if (world.plate.length === 0) return;
  world.stats.wasted += world.plate.length;
  world.plate = [];
  world.combo = 0;
  addFloat(world, world.chef.x, world.chef.y - 34, 'Piring dibuang!', '#ff9d2e');
  audio.drop();
}

export function update(world, dt, input, audio) {
  if (world.screen !== 'playing') return;
  world.time += dt;
  world.shiftLeft -= dt;
  if (world.flash > 0) world.flash = Math.max(0, world.flash - dt * 1.6);
  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt * 30);

  if (!world.rush && world.shiftLeft <= RUSH_AT) {
    world.rush = true;
    if (!world.rushAnnounced) {
      world.rushAnnounced = true;
      addFloat(world, 640, 240, 'JAM RAMAI! Pesanan makin cepat!', '#ff9d2e');
      audio.rush();
    }
  }

  // Orders: countdown, expiry, spawning.
  for (const o of world.orders.slice()) {
    o.left -= dt;
    if (o.left <= 0) expireOrder(world, o, audio);
    if (world.screen !== 'playing') return;
  }
  world.spawnIn -= dt;
  if (world.spawnIn <= 0) {
    spawnOrder(world);
    if (world.orders.length > 0) audio.orderIn();
    world.spawnIn = spawnInterval(world);
  }

  // Chopping: hold Space near the board while a chop is running.
  if (world.board) {
    const near = dist(world.chef, { x: STATIONS.board.x + 110, y: STATIONS.board.y + 110 }) < INTERACT_DIST + 40;
    if (near && input.chopping) {
      world.board.left -= dt;
      if (world.rng() < dt * 14) {
        burst(world, STATIONS.board.x + 110, STATIONS.board.y + 42, '#e8c890', 2);
        audio.chop();
      }
      if (world.board.left <= 0) {
        const done = { ...world.board.item, state: 'done' };
        world.board = null;
        if (world.carry.length < CARRY_MAX) {
          world.carry.push(done);
          world.stats.chopped += 1;
          audio.cooked();
        } else {
          addFloat(world, world.chef.x, world.chef.y - 34, 'Tangan penuh!', '#ff6b5e');
        }
      }
    }
  }

  // Cooking: automatic once dropped in the wok.
  if (world.wok) {
    world.wok.left -= dt;
    if (world.rng() < dt * 8) {
      burst(world, STATIONS.wok.x + 110, STATIONS.wok.y + 30, '#ff9d2e', 1);
    }
    if (world.wok.left <= 0) {
      const done = { ...world.wok.item, state: 'done' };
      world.wok = null;
      audio.sizzleStop();
      if (world.carry.length < CARRY_MAX) {
        world.carry.push(done);
        world.stats.cooked += 1;
        audio.cooked();
        addFloat(world, STATIONS.wok.x + 110, STATIONS.wok.y - 16, `${INGREDIENTS[done.id].name} matang!`, '#7be495');
      } else {
        addFloat(world, world.chef.x, world.chef.y - 34, 'Tangan penuh!', '#ff6b5e');
      }
    }
  }

  // Chef movement: keyboard, or click-to-move with auto-interact.
  const chef = world.chef;
  const ax = input.axis();
  if (ax.x !== 0 || ax.y !== 0) {
    chef.target = null;
    chef.autoAct = null;
    chef.x += ax.x * CHEF_SPEED * dt;
    chef.y += ax.y * CHEF_SPEED * dt;
    chef.dir = ax.x !== 0 ? Math.sign(ax.x) : chef.dir;
    chef.moving = true;
  } else if (chef.target) {
    const dx = chef.target.x - chef.x;
    const dy = chef.target.y - chef.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) {
      chef.target = null;
      chef.moving = false;
      if (chef.autoAct) {
        const st = chef.autoAct;
        chef.autoAct = null;
        requestInteract(world, st, audio);
      }
    } else {
      chef.x += (dx / d) * CHEF_SPEED * dt;
      chef.y += (dy / d) * CHEF_SPEED * dt;
      chef.dir = dx !== 0 ? Math.sign(dx) : chef.dir;
      chef.moving = true;
    }
  } else {
    chef.moving = false;
  }

  // Keep the chef inside the kitchen floor.
  chef.x = Math.max(40, Math.min(1240, chef.x));
  chef.y = Math.max(180, Math.min(660, chef.y));

  // Mouse click: walk to a station and use it, or just walk to the floor.
  const click = input.takeClick();
  if (click) {
    const st = stationAt(world, click.x, click.y);
    if (st) {
      chef.target = nearestStationPoint(world, st);
      chef.autoAct = st;
    } else if (click.y > 150) {
      chef.target = { x: click.x, y: click.y };
      chef.autoAct = null;
    }
    audio.unlock();
  }

  // E: use the nearest station in range.
  if (input.wasPressed('e')) {
    const near = nearestStation(world);
    if (near) requestInteract(world, near, audio);
  }
  if (input.wasPressed('x')) clearPlate(world, audio);
  if (input.wasPressed('p')) {
    world.screen = 'paused';
    audio.sizzleStop();
  }

  // Particles and floating texts.
  for (const p of world.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 160 * dt;
  }
  world.particles = world.particles.filter((p) => p.life > 0);
  for (const f of world.floats) {
    f.life += dt;
    f.y -= 26 * dt;
  }
  world.floats = world.floats.filter((f) => f.life < f.max);

  if (world.shiftLeft <= 0) {
    world.shiftLeft = 0;
    endShift(world, audio);
  }
}

function nearestStation(world) {
  const chef = world.chef;
  const all = [
    ...STATIONS.crates.map((c) => ({ kind: 'crate', id: c.id, ...c })),
    { kind: 'board', ...STATIONS.board },
    { kind: 'wok', ...STATIONS.wok },
    { kind: 'plate', ...STATIONS.plate },
    { kind: 'window', ...STATIONS.window },
  ];
  let best = null;
  let bestD = Infinity;
  for (const s of all) {
    const cx = Math.max(s.x, Math.min(chef.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(chef.y, s.y + s.h));
    const d = Math.hypot(chef.x - cx, chef.y - cy);
    if (d < bestD) { bestD = d; best = s; }
  }
  return bestD <= INTERACT_DIST ? best : null;
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
