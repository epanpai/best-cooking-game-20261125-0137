// Dapur Kilat — all sound is synthesized with WebAudio: no audio files,
// no network. Short blips for pickup/chop/sizzle/serve, a two-note ding
// for a new order, and a low buzz when an order expires.

export function makeAudio() {
  let ctx = null;
  let muted = false;
  let sizzleNodes = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol, filterFreq) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const len = Math.floor(c.sampleRate * dur);
    const buffer = c.createBuffer(1, len, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = c.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(c.destination);
    src.start();
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    pickup() { tone(520, 0.07, 'triangle', 0.12); },
    chop() { noise(0.09, 0.25, 900); tone(180, 0.06, 'square', 0.06); },
    drop() { tone(300, 0.08, 'sine', 0.12, 0, 180); },
    cooked() { tone(660, 0.1, 'triangle', 0.14); tone(880, 0.14, 'triangle', 0.14, 0.09); },
    plate() { tone(740, 0.06, 'sine', 0.12); },
    serve() {
      tone(784, 0.12, 'triangle', 0.16);
      tone(1047, 0.18, 'triangle', 0.16, 0.1);
      tone(1319, 0.22, 'triangle', 0.12, 0.2);
    },
    orderIn() { tone(587, 0.1, 'triangle', 0.12); tone(880, 0.12, 'triangle', 0.12, 0.1); },
    expire() { tone(220, 0.35, 'sawtooth', 0.1, 0, 110); },
    rush() { tone(440, 0.12, 'square', 0.08); tone(440, 0.12, 'square', 0.08, 0.16); tone(587, 0.2, 'square', 0.08, 0.32); },
    click() { tone(700, 0.04, 'sine', 0.08); },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.13));
    },
    sizzleStart() {
      if (muted || sizzleNodes) return;
      const c = ensure();
      if (!c) return;
      const len = c.sampleRate;
      const buffer = c.createBuffer(1, len, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = c.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3000;
      const gain = c.createGain();
      gain.gain.value = 0.035;
      src.connect(filter).connect(gain).connect(c.destination);
      src.start();
      sizzleNodes = { src, gain };
    },
    sizzleStop() {
      if (!sizzleNodes) return;
      try { sizzleNodes.src.stop(); } catch { /* already stopped */ }
      sizzleNodes = null;
    },
  };
}
