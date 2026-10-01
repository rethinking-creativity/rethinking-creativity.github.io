// Soft card-flip sound, synthesised with Web Audio (no audio file).
// Browsers only allow sound after the visitor has clicked, tapped, or pressed a key once,
// so hover flips stay silent until then.
(function () {
  let ctx = null, last = 0;
  const unlock = () => {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } }
    if (ctx.state === 'suspended') ctx.resume();
  };
  ['pointerdown', 'keydown'].forEach((t) => window.addEventListener(t, unlock, { passive: true }));

  window.flipSound = function () {
    if (!ctx || ctx.state !== 'running') return;
    const now = performance.now();
    if (now - last < 70) return; // avoid a buzz when sweeping across many cards
    last = now;
    const t = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.09);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const band = ctx.createBiquadFilter(); band.type = 'bandpass'; band.Q.value = 1.2;
    band.frequency.setValueAtTime(2600, t); band.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    src.connect(band).connect(g).connect(ctx.destination);
    src.start(t);
  };
})();
