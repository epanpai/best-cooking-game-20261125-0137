// Dapur Kilat — entry point: canvas setup, fixed-step loop, screens,
// and the ?shot= path that stages a screenshot scene and reports ready.

import { VIEW_W, VIEW_H } from './config.js';
import { makeWorld, startShift, update } from './world.js';
import { makeInput } from './input.js';
import { makeAudio } from './audio.js';
import { render } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

function fitCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = VIEW_W * dpr;
  canvas.height = VIEW_H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || 7) || 7;
const shot = params.get('shot');

const world = makeWorld(seed);
const input = makeInput(canvas);
const audio = makeAudio();

let shotStaged = false;
if (shot) {
  stageShot(world, shot, seed);
  shotStaged = true;
}

let last = performance.now();
let acc = 0;
const STEP = 1 / 60;

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  input.beginFrame();

  if (!shotStaged) {
    if (world.screen === 'title') {
      world.time += dt;
      if (input.wasPressed('enter') || input.takeClick()) {
        audio.unlock();
        audio.click();
        startShift(world);
      }
      input.consumeEdges();
    } else if (world.screen === 'paused') {
      if (input.wasPressed('p') || input.wasPressed('enter')) {
        world.screen = 'playing';
        audio.click();
      }
      input.consumeEdges();
    } else if (world.screen === 'over') {
      world.time += dt;
      if (input.wasPressed('r') || input.wasPressed('enter')) {
        startShift(world);
        audio.click();
      }
      input.consumeEdges();
    } else {
      const mutePressed = input.wasPressed('m');
      acc += dt;
      let firstStep = true;
      while (acc >= STEP) {
        update(world, STEP, input, audio);
        if (firstStep) { input.consumeEdges(); firstStep = false; }
        acc -= STEP;
      }
      if (mutePressed) {
        world.muted = audio.toggleMute();
      }
    }
  }

  render(ctx, world);

  // Screen-reader status line, updated sparingly.
  if (world.screen === 'playing' && Math.floor(world.time * 2) !== Math.floor((world.time - dt) * 2)) {
    status.textContent = `Skor Rp${world.score}, ${world.orders.length} pesanan, ${Math.ceil(world.shiftLeft)} detik tersisa.`;
  }

  if (shotStaged) {
    window.__shotReady = true;
    window.__game = { world };
  } else {
    window.__game = { world };
    requestAnimationFrame(frame);
  }
}

requestAnimationFrame(frame);
