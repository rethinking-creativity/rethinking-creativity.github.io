// Drift: work cards float slowly around the title. Drag one to move it; it keeps drifting from where you drop it.
(function () {
  const field = document.querySelector('[data-drift]');
  if (!field) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const media = ['text', 'image', 'video', 'sound'];
  const lines = [
    'the tide keeps the shape of the bay',
    'a window, then the rain behind it',
    'she counted the stairs twice',
    'what the river forgot to carry',
  ];
  const n = window.innerWidth < 600 ? 10 : 16;
  const W = () => field.clientWidth;
  const H = () => field.clientHeight;
  const cards = [];

  for (let i = 0; i < n; i++) {
    const m = media[i % 4];
    const el = document.createElement('div');
    el.className = `wcard wcard--${m}`;
    el.setAttribute('aria-hidden', 'true');
    el.style.setProperty('--w', `${7 + Math.random() * 4}rem`);
    el.style.setProperty('--ar', m === 'video' || m === 'sound' ? '16 / 10' : '4 / 5');
    const art = document.createElement('div');
    art.className = 'wcard__art';
    if (m === 'text') art.textContent = lines[i % lines.length];
    const cap = document.createElement('div');
    cap.className = 'wcard__cap';
    cap.innerHTML = `<span>${m[0].toUpperCase() + m.slice(1)}</span><span>?</span>`;
    el.append(art, cap);
    field.appendChild(el);
    cards.push({
      el,
      x: Math.random() * (W() - 120),
      y: Math.random() * (H() - 160),
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: (Math.random() - 0.5) * 12,
      vr: (Math.random() - 0.5) * 0.03,
      drag: false,
    });
  }

  function place(c) { c.el.style.transform = `translate(${c.x}px, ${c.y}px) rotate(${c.r}deg)`; }
  cards.forEach(place);

  let active = null, ox = 0, oy = 0, lastX = 0, lastY = 0;
  field.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.wcard');
    if (!el) return;
    active = cards.find((c) => c.el === el);
    active.drag = true;
    el.setPointerCapture(e.pointerId);
    el.style.zIndex = '5';
    ox = e.clientX - active.x; oy = e.clientY - active.y;
    lastX = e.clientX; lastY = e.clientY;
  });
  field.addEventListener('pointermove', (e) => {
    if (!active) return;
    active.vx = (e.clientX - lastX) * 0.2; active.vy = (e.clientY - lastY) * 0.2;
    lastX = e.clientX; lastY = e.clientY;
    active.x = e.clientX - ox; active.y = e.clientY - oy;
    place(active);
  });
  const release = () => { if (active) { active.drag = false; active.el.style.zIndex = ''; active = null; } };
  field.addEventListener('pointerup', release);
  field.addEventListener('pointercancel', release);

  if (reduce) return;
  function tick() {
    const w = W(), h = H();
    for (const c of cards) {
      if (c.drag) continue;
      c.vx *= 0.985; c.vy *= 0.985;
      // Keep a gentle minimum drift
      if (Math.abs(c.vx) < 0.08) c.vx += (Math.random() - 0.5) * 0.02;
      if (Math.abs(c.vy) < 0.08) c.vy += (Math.random() - 0.5) * 0.02;
      c.x += c.vx; c.y += c.vy; c.r += c.vr;
      const cw = c.el.offsetWidth, ch = c.el.offsetHeight;
      if (c.x < -cw * 0.3 || c.x > w - cw * 0.7) c.vx *= -1;
      if (c.y < -ch * 0.3 || c.y > h - ch * 0.7) c.vy *= -1;
      place(c);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
