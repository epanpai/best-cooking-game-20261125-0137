// Dapur Kilat — all drawing: the kitchen, the chef, the order board, the
// HUD and the title/pause/results screens. Canvas 2D only, no images.

import { VIEW_W, VIEW_H, PALETTE, STATIONS, FLOOR, MAX_HEARTS, CHOP_SECONDS, COOK_SECONDS } from './config.js';
import { INGREDIENTS, DISHES, dishByName, plateProgress } from './recipes.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

export function drawIngredient(ctx, id, x, y, r, state = 'done') {
  const ing = INGREDIENTS[id];
  ctx.save();
  ctx.translate(x, y);
  if (state === 'raw') ctx.globalAlpha = 0.55;
  ctx.fillStyle = ing.color;
  ctx.strokeStyle = ing.dark;
  ctx.lineWidth = Math.max(1.5, r * 0.12);
  if (id === 'nasi') {
    ctx.beginPath(); ctx.ellipse(0, r * 0.25, r, r * 0.62, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.1, r * 0.16, 0, 7); ctx.arc(r * 0.25, -r * 0.25, r * 0.14, 0, 7); ctx.arc(0, -r * 0.35, r * 0.13, 0, 7); ctx.fill();
  } else if (id === 'mie') {
    ctx.lineWidth = r * 0.22;
    ctx.strokeStyle = ing.color;
    ctx.beginPath();
    for (let i = -1; i <= 1; i += 1) {
      ctx.moveTo(-r * 0.8, i * r * 0.4);
      ctx.bezierCurveTo(-r * 0.3, i * r * 0.4 - r * 0.35, r * 0.3, i * r * 0.4 + r * 0.35, r * 0.8, i * r * 0.4);
    }
    ctx.stroke();
  } else if (id === 'ayam') {
    ctx.beginPath(); ctx.arc(-r * 0.15, -r * 0.1, r * 0.62, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#f4e3c2'; ctx.lineWidth = r * 0.22;
    ctx.beginPath(); ctx.moveTo(r * 0.35, r * 0.35); ctx.lineTo(r * 0.85, r * 0.85); ctx.stroke();
    ctx.fillStyle = '#f4e3c2';
    ctx.beginPath(); ctx.arc(r * 0.9, r * 0.9, r * 0.2, 0, 7); ctx.fill();
  } else if (id === 'telur') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.95, r * 0.7, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffc93c';
    ctx.beginPath(); ctx.arc(r * 0.1, 0, r * 0.42, 0, 7); ctx.fill();
  } else if (id === 'sayur') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.1, r * 0.5, 0, 7); ctx.arc(r * 0.35, -r * 0.15, r * 0.48, 0, 7); ctx.arc(0, r * 0.35, r * 0.45, 0, 7); ctx.fill();
    ctx.strokeStyle = ing.dark;
    ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.1, r * 0.5, 0, 7); ctx.stroke();
  } else if (id === 'cabai') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, -r * 0.3);
    ctx.quadraticCurveTo(0, -r * 1.1, r * 0.8, -r * 0.2);
    ctx.quadraticCurveTo(r * 0.5, r * 0.5, -r * 0.2, r * 0.55);
    ctx.quadraticCurveTo(-r * 0.7, r * 0.4, -r * 0.8, -r * 0.3);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#2f7d3c'; ctx.lineWidth = r * 0.18;
    ctx.beginPath(); ctx.moveTo(r * 0.75, -r * 0.25); ctx.quadraticCurveTo(r * 1.05, -r * 0.6, r * 0.9, -r * 0.95); ctx.stroke();
  }
  ctx.restore();
  if (state === 'raw') {
    ctx.save();
    ctx.fillStyle = '#ff9d2e';
    ctx.beginPath(); ctx.arc(x + r * 0.7, y - r * 0.7, r * 0.32, 0, 7); ctx.fill();
    ctx.fillStyle = '#2b1a0e';
    ctx.font = `bold ${Math.max(9, r * 0.42)}px system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('!', x + r * 0.7, y - r * 0.7 + 0.5);
    ctx.restore();
  }
}

function drawStation(ctx, s, label, body) {
  ctx.save();
  ctx.fillStyle = PALETTE.counterFront;
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  rr(ctx, s.x, s.y, s.w, s.h - 14, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.counterEdge;
  ctx.lineWidth = 2;
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.stroke();
  body();
  text(ctx, label, s.x + s.w / 2, s.y + s.h - 6, 12, PALETTE.cream, 'bold', 'center');
  ctx.restore();
}

function drawOrderTicket(ctx, order, x, y, w, h, now) {
  const dish = dishByName(order.dish);
  const frac = Math.max(0, order.left / order.maxLeft);
  const urgent = order.left < 12;
  const pulse = urgent ? 0.5 + 0.5 * Math.sin(now * 8) : 0;
  ctx.save();
  ctx.fillStyle = urgent ? `rgb(255,${Math.floor(220 - pulse * 60)},${Math.floor(200 - pulse * 60)})` : '#fff8e6';
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = urgent ? '#d93b2b' : '#c9a86a';
  ctx.lineWidth = urgent ? 3 : 2;
  rr(ctx, x, y, w, h, 10);
  ctx.stroke();
  text(ctx, order.dish, x + 12, y + 18, 14, PALETTE.ink, 'bold');
  text(ctx, `Rp${dish.price}`, x + 12, y + 38, 12, '#8a5a24', 'bold');
  text(ctx, `${Math.ceil(order.left)} dtk`, x + w - 12, y + 38, 12, urgent ? '#d93b2b' : '#6e4520', 'bold', 'right');
  dish.needs.forEach((id, i) => {
    drawIngredient(ctx, id, x + 24 + i * 34, y + 58, 11, 'done');
  });
  // patience bar
  ctx.fillStyle = '#e5d3ae';
  rr(ctx, x + 12, y + h - 14, w - 24, 8, 4);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#3f9e4d' : frac > 0.25 ? '#ff9d2e' : '#d93b2b';
  if (frac > 0) { rr(ctx, x + 12, y + h - 14, (w - 24) * frac, 8, 4); ctx.fill(); }
  ctx.restore();
}

export function render(ctx, world) {
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  }
  drawKitchen(ctx, world);
  if (world.screen === 'title') drawTitle(ctx, world);
  else if (world.screen === 'paused') drawPaused(ctx, world);
  else if (world.screen === 'over') drawOver(ctx, world);
  if (world.flash > 0) {
    ctx.fillStyle = `rgba(217,59,43,${world.flash * 0.25})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  ctx.restore();
}

function drawKitchen(ctx, world) {
  // Floor tiles.
  for (let ty = 0; ty < 8; ty += 1) {
    for (let tx = 0; tx < 18; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(FLOOR.x + tx * 68.5, FLOOR.y + ty * 68.5, 68.5, 68.5);
    }
  }
  ctx.strokeStyle = 'rgba(60,30,10,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h);

  // Top HUD band.
  ctx.fillStyle = '#3a2412';
  ctx.fillRect(0, 0, VIEW_W, 132);
  ctx.fillStyle = '#2b1a0e';
  ctx.fillRect(0, 128, VIEW_W, 4);

  // Brand + shift timer + score + hearts.
  text(ctx, 'DAPUR KILAT', 24, 30, 26, '#ffc93c', 'bold');
  text(ctx, 'Warung Kilat', 24, 56, 13, '#f4e3c2', 'normal');
  const shiftFrac = Math.max(0, world.shiftLeft / 150);
  text(ctx, `Shift: ${Math.ceil(world.shiftLeft)} dtk`, 24, 84, 15, world.rush ? '#ff9d2e' : '#fff3d6', 'bold');
  ctx.fillStyle = '#5a3a1c';
  rr(ctx, 24, 96, 220, 10, 5); ctx.fill();
  ctx.fillStyle = world.rush ? '#ff9d2e' : '#3f9e4d';
  if (shiftFrac > 0) { rr(ctx, 24, 96, 220 * shiftFrac, 10, 5); ctx.fill(); }
  if (world.rush) text(ctx, 'JAM RAMAI!', 260, 84, 15, '#ff9d2e', 'bold');

  text(ctx, `Rp${world.score}`, 560, 34, 26, '#fff3d6', 'bold', 'center');
  text(ctx, 'koin', 560, 58, 12, '#d9c48f', 'normal', 'center');
  text(ctx, `Combo x${(1 + Math.min(world.combo, 8) * 0.25).toFixed(2).replace(/\.?0+$/, '')}`, 560, 84, 14, world.combo >= 2 ? '#7be495' : '#d9c48f', 'bold', 'center');
  text(ctx, `Tersaji: ${world.served}`, 560, 106, 13, '#d9c48f', 'normal', 'center');

  for (let i = 0; i < MAX_HEARTS; i += 1) {
    const hx = 700 + i * 34;
    ctx.fillStyle = i < world.hearts ? '#ff5b4d' : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(hx, 36);
    ctx.bezierCurveTo(hx - 12, 22, hx - 22, 34, hx, 48);
    ctx.bezierCurveTo(hx + 22, 34, hx + 12, 22, hx, 36);
    ctx.fill();
  }
  text(ctx, 'reputasi', 716, 62, 11, '#d9c48f', 'normal', 'center');

  // Order board.
  text(ctx, 'PAPAN PESANAN', 790, 26, 14, '#ffc93c', 'bold');
  if (world.orders.length === 0) {
    ctx.fillStyle = 'rgba(255,243,214,0.55)';
    ctx.font = 'italic 14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Belum ada pesanan…', 790, 70);
  }
  world.orders.forEach((o, i) => {
    drawOrderTicket(ctx, o, 790 + i * 118, 36, 110, 84, world.time);
  });

  // Ingredient crates.
  for (const c of STATIONS.crates) {
    drawStation(ctx, c, c.label, () => {
      drawIngredient(ctx, c.id, c.x + c.w / 2, c.y + (c.h - 14) / 2 - 4, 18, 'done');
    });
  }

  // Cutting board.
  drawStation(ctx, STATIONS.board, 'Talenan — tahan SPASI', () => {
    ctx.fillStyle = PALETTE.board;
    rr(ctx, STATIONS.board.x + 24, STATIONS.board.y + 10, 172, 42, 8);
    ctx.fill();
    if (world.board) {
      drawIngredient(ctx, world.board.item.id, STATIONS.board.x + 70, STATIONS.board.y + 31, 15, 'raw');
      const frac = 1 - world.board.left / world.board.max;
      ctx.fillStyle = '#e5d3ae';
      rr(ctx, STATIONS.board.x + 100, STATIONS.board.y + 26, 84, 10, 5); ctx.fill();
      ctx.fillStyle = '#3f9e4d';
      if (frac > 0) { rr(ctx, STATIONS.board.x + 100, STATIONS.board.y + 26, 84 * frac, 10, 5); ctx.fill(); }
      text(ctx, 'POTONG!', STATIONS.board.x + 142, STATIONS.board.y + 48, 11, '#2b1a0e', 'bold', 'center');
    } else {
      text(ctx, 'letakkan bahan mentah', STATIONS.board.x + 110, STATIONS.board.y + 31, 12, '#6e4520', 'normal', 'center');
    }
  });

  // Wok / stove.
  drawStation(ctx, STATIONS.wok, 'Wajan — masak otomatis', () => {
    const cx = STATIONS.wok.x + 52;
    const cy = STATIONS.wok.y + 30;
    ctx.fillStyle = PALETTE.wok;
    ctx.beginPath(); ctx.arc(cx, cy, 24, 0, 7); ctx.fill();
    ctx.strokeStyle = '#22262b'; ctx.lineWidth = 3; ctx.stroke();
    if (world.wok) {
      const flick = Math.sin(world.time * 14) * 3;
      ctx.fillStyle = '#ff9d2e';
      ctx.beginPath(); ctx.ellipse(cx, cy + 26, 20 + flick, 6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffd23e';
      ctx.beginPath(); ctx.ellipse(cx, cy + 25, 11 + flick * 0.5, 4, 0, 0, 7); ctx.fill();
      drawIngredient(ctx, world.wok.item.id, cx, cy, 12, 'raw');
      const frac = 1 - world.wok.left / world.wok.max;
      ctx.fillStyle = '#e5d3ae';
      rr(ctx, STATIONS.wok.x + 16, STATIONS.wok.y + 64, 188, 6, 3); ctx.fill();
      ctx.fillStyle = '#ff9d2e';
      if (frac > 0) { rr(ctx, STATIONS.wok.x + 16, STATIONS.wok.y + 64, 188 * frac, 6, 3); ctx.fill(); }
      text(ctx, 'memasak…', STATIONS.wok.x + 150, cy, 12, '#f4e3c2', 'normal', 'center');
    } else {
      text(ctx, 'letakkan bahan mentah', STATIONS.wok.x + 150, cy, 12, '#f4e3c2', 'normal', 'center');
    }
  });

  // Plating station.
  drawStation(ctx, STATIONS.plate, 'Meja Plating — E: taruh / ambil', () => {
    ctx.fillStyle = PALETTE.plate;
    ctx.beginPath(); ctx.ellipse(STATIONS.plate.x + 150, STATIONS.plate.y + 40, 92, 26, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#c9a86a'; ctx.lineWidth = 2; ctx.stroke();
    world.plate.forEach((id, i) => {
      drawIngredient(ctx, id, STATIONS.plate.x + 90 + i * 40, STATIONS.plate.y + 36, 14, 'done');
    });
    const match = world.orders.find((o) => {
      const d = dishByName(o.dish);
      return world.plate.length > 0 && plateProgress(world.plate, d).done === d.needs.length;
    });
    if (match) {
      const glow = 0.5 + 0.5 * Math.sin(world.time * 6);
      ctx.fillStyle = `rgba(255,201,60,${0.25 + glow * 0.3})`;
      ctx.beginPath(); ctx.ellipse(STATIONS.plate.x + 150, STATIONS.plate.y + 40, 104, 34, 0, 0, 7); ctx.fill();
      text(ctx, `SIAP! ${match.dish}`, STATIONS.plate.x + 150, STATIONS.plate.y + 40, 13, '#2b1a0e', 'bold', 'center');
    } else if (world.plate.length > 0) {
      const best = world.orders.map((o) => ({ o, p: plateProgress(world.plate, dishByName(o.dish)) }))
        .sort((a, b) => b.p.done - a.p.done)[0];
      if (best) text(ctx, `${best.p.done}/${best.p.total} — ${best.o.dish}`, STATIONS.plate.x + 150, STATIONS.plate.y + 58, 11, '#6e4520', 'bold', 'center');
    }
  });

  // Serving window.
  drawStation(ctx, STATIONS.window, 'Jendela Saji — E: sajikan', () => {
    ctx.fillStyle = PALETTE.window;
    rr(ctx, STATIONS.window.x + 16, STATIONS.window.y + 6, 188, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#8a5a24';
    for (let i = 0; i < 5; i += 1) ctx.fillRect(STATIONS.window.x + 30 + i * 36, STATIONS.window.y + 6, 4, 30);
    text(ctx, 'PELANGGAN', STATIONS.window.x + 110, STATIONS.window.y + 56, 13, '#f4e3c2', 'bold', 'center');
  });

  drawChef(ctx, world);
  drawCarry(ctx, world);

  // Particles.
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Floating texts.
  for (const f of world.floats) {
    ctx.globalAlpha = Math.max(0, 1 - f.life / f.max);
    text(ctx, f.text, f.x, f.y, 17, f.color, 'bold', 'center');
  }
  ctx.globalAlpha = 1;

  // Controls hint.
  text(ctx, 'WASD / panah: jalan   •   E: pakai stasiun   •   tahan SPASI: potong   •   X: buang piring   •   P: jeda   •   M: suara   •   klik stasiun: jalan ke sana', 640, 706, 12, '#e8c890', 'normal', 'center');
}

function drawChef(ctx, world) {
  const c = world.chef;
  const bob = c.moving ? Math.sin(world.time * 14) * 2 : 0;
  ctx.save();
  ctx.translate(c.x, c.y + bob);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 18, 20, 7, 0, 0, 7); ctx.fill();
  // Body (apron).
  ctx.fillStyle = '#fdf6e3';
  rr(ctx, -15, -6, 30, 26, 10);
  ctx.fill();
  ctx.strokeStyle = '#c9a86a'; ctx.lineWidth = 2;
  rr(ctx, -15, -6, 30, 26, 10);
  ctx.stroke();
  // Head.
  ctx.fillStyle = '#f2c48d';
  ctx.beginPath(); ctx.arc(0, -18, 12, 0, 7); ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  rr(ctx, -13, -36, 26, 12, 6); ctx.fill();
  ctx.beginPath(); ctx.arc(-8, -34, 7, 0, 7); ctx.arc(0, -38, 8, 0, 7); ctx.arc(8, -34, 7, 0, 7); ctx.fill();
  // Eyes.
  ctx.fillStyle = '#2b1a0e';
  ctx.beginPath(); ctx.arc(-4 * c.dir, -19, 1.8, 0, 7); ctx.arc(4 * c.dir, -19, 1.8, 0, 7); ctx.fill();
  ctx.restore();
}

function drawCarry(ctx, world) {
  const c = world.chef;
  world.carry.forEach((item, i) => {
    const x = c.x - (world.carry.length - 1) * 16 + i * 32;
    const y = c.y - 52;
    ctx.save();
    ctx.fillStyle = 'rgba(255,248,230,0.92)';
    ctx.beginPath(); ctx.arc(x, y, 15, 0, 7); ctx.fill();
    ctx.strokeStyle = '#c9a86a'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    if (item.id.startsWith('plate:')) {
      ctx.fillStyle = PALETTE.plate;
      ctx.beginPath(); ctx.ellipse(x, y, 13, 7, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#c9a86a'; ctx.stroke();
      const dish = dishByName(item.id.slice(6));
      dish.needs.slice(0, 3).forEach((id, j) => drawIngredient(ctx, id, x - 8 + j * 8, y - 2, 5, 'done'));
    } else {
      drawIngredient(ctx, item.id, x, y, 10, item.state);
    }
  });
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(30,16,6,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'DAPUR KILAT', 640, 190, 72, '#ffc93c', 'bold', 'center');
  text(ctx, 'Warung Kilat — masak cepat, saji tepat', 640, 250, 22, '#fff3d6', 'normal', 'center');
  const lines = [
    'Ambil bahan dari peti di kiri, potong di talenan (tahan SPASI),',
    'masak di wajan, rakit di meja plating, sajikan di jendela saji.',
    'Sajikan sebelum waktu pesanan habis — tip makin besar kalau cepat,',
    'combo beruntun melipatgandakan koin. Shift 150 detik. 3 hati reputasi.',
  ];
  lines.forEach((l, i) => text(ctx, l, 640, 310 + i * 28, 17, '#f4e3c2', 'normal', 'center'));
  text(ctx, 'MENU HARI INI', 640, 452, 15, '#ffc93c', 'bold', 'center');
  DISHES.forEach((d, i) => {
    const x = 300 + i * 120;
    text(ctx, d.name, x, 486, 14, '#fff3d6', 'bold', 'center');
    d.needs.forEach((id, j) => drawIngredient(ctx, id, x - (d.needs.length - 1) * 15 + j * 30, 516, 11, 'done'));
    text(ctx, `Rp${d.price}`, x, 544, 12, '#d9c48f', 'normal', 'center');
  });
  const blink = 0.6 + 0.4 * Math.sin(world.time * 4);
  ctx.globalAlpha = blink;
  text(ctx, 'Tekan ENTER atau klik untuk mulai  •  WASD / panah + mouse', 640, 610, 18, '#ffffff', 'bold', 'center');
  ctx.globalAlpha = 1;
}

function drawPaused(ctx, world) {
  ctx.fillStyle = 'rgba(30,16,6,0.66)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'JEDA', 640, 330, 56, '#fff3d6', 'bold', 'center');
  text(ctx, 'Tekan P untuk lanjut', 640, 400, 18, '#f4e3c2', 'normal', 'center');
}

function drawOver(ctx, world) {
  ctx.fillStyle = 'rgba(30,16,6,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'SHIFT SELESAI!', 640, 200, 54, '#ffc93c', 'bold', 'center');
  text(ctx, `Grade: ${world.grade}`, 640, 272, 40, '#7be495', 'bold', 'center');
  text(ctx, `Koin: Rp${world.score}    •    Tersaji: ${world.served} piring    •    Hangus: ${world.expired}`, 640, 340, 20, '#fff3d6', 'normal', 'center');
  text(ctx, `Combo terbaik: x${(1 + Math.min(world.bestCombo, 8) * 0.25).toFixed(2).replace(/\.?0+$/, '')} (${world.bestCombo} sajian beruntun)`, 640, 378, 17, '#d9c48f', 'normal', 'center');
  text(ctx, `Dipotong: ${world.stats.chopped}   •   Dimasak: ${world.stats.cooked}   •   Terbuang: ${world.stats.wasted}`, 640, 412, 16, '#d9c48f', 'normal', 'center');
  const blink = 0.6 + 0.4 * Math.sin(world.time * 4);
  ctx.globalAlpha = blink;
  text(ctx, 'Tekan R untuk main lagi', 640, 480, 18, '#ffffff', 'bold', 'center');
  ctx.globalAlpha = 1;
}
