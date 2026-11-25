// Dapur Kilat — keyboard + mouse input. WASD/arrows move, E interacts,
// Space (hold) chops, X clears the plate, P pauses, M mutes. Clicking a
// station walks the chef there and interacts on arrival.

export function makeInput(canvas) {
  const keys = new Set();
  const pressed = new Set(); // raw edges, filled by listeners
  const framePressed = new Set(); // edges visible to this frame's logic
  let click = null; // {x, y} in canvas space, consumed by the game each frame
  let mouse = { x: 0, y: 0 };

  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 1280,
      y: ((e.clientY - r.top) / r.height) * 720,
    };
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (!e.repeat) pressed.add(k);
    keys.add(k);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousedown', (e) => {
    click = canvasPos(e);
    mouse = click;
  });
  canvas.addEventListener('mousemove', (e) => { mouse = canvasPos(e); });

  return {
    axis() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
      return { x, y };
    },
    get chopping() { return keys.has(' '); },
    wasPressed(key) { return framePressed.has(key); },
    // Move fresh edges into this frame's set (merging, so an edge that
    // arrives on a frame where no update step runs survives to the next).
    beginFrame() {
      for (const k of pressed) framePressed.add(k);
      pressed.clear();
    },
    // Drop this frame's edges after the first update step (or screen
    // branch) has read them, so one keypress never fires twice.
    consumeEdges() { framePressed.clear(); },
    takeClick() { const c = click; click = null; return c; },
    get mouse() { return mouse; },
  };
}
