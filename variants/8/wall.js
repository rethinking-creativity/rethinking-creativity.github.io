// Wall of works. Moving the pointer across the wall flips nearby cards in a wave,
// nearest first, to show whether a person or an AI made each work. Cards turn back after a moment.
(function () {
  const field = document.querySelector('[data-wall]');
  if (!field) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Human works are public-domain pieces from Wikimedia Commons. AI works were made by Claude for this page.
  const works = [
    { who: 'human', kind: 'img', src: 'img/hokusai.jpg', alt: 'The Great Wave off Kanagawa', how: 'Hokusai, woodblock print, about 1831' },
    { who: 'ai', kind: 'text', text: 'The kettle hums a song it learned from rain, and no one in the kitchen asks the rain.', how: 'Claude, one prompt, a few seconds' },
    { who: 'human', kind: 'img', src: 'img/vangogh.jpg', alt: 'The Starry Night', how: 'Van Gogh, oil on canvas, 1889' },
    { who: 'ai', kind: 'canvas', seed: 3, how: 'Claude, code that draws itself, one prompt' },
    { who: 'human', kind: 'film', alt: 'The Horse in Motion', how: 'Muybridge, twelve cameras, 1878' },
    { who: 'human', kind: 'text', text: '“Hope” is the thing with feathers – / That perches in the soul –', how: 'Emily Dickinson, poem, about 1861' },
    { who: 'ai', kind: 'canvas', seed: 7, how: 'Claude, generated pattern, one prompt' },
    { who: 'human', kind: 'img', src: 'img/vermeer.jpg', alt: 'Girl with a Pearl Earring', how: 'Vermeer, oil on canvas, about 1665' },
    { who: 'ai', kind: 'text', text: 'Every map forgets the walk that made it.', how: 'Claude, one prompt, a few seconds' },
    { who: 'human', kind: 'img', src: 'img/monet.jpg', alt: 'Impression, Sunrise', how: 'Monet, oil on canvas, 1872' },
    { who: 'ai', kind: 'video', seed: 11, how: 'Claude, animated code, one prompt' },
    { who: 'human', kind: 'img', src: 'img/hiroshige.jpg', alt: 'Sudden Shower over Shin-Ohashi Bridge', how: 'Hiroshige, woodblock print, 1857' },
    { who: 'human', kind: 'text', text: 'I celebrate myself, and sing myself, / And what I assume you shall assume,', how: 'Walt Whitman, poem, 1855' },
    { who: 'ai', kind: 'canvas', seed: 19, how: 'Claude, generated pattern, one prompt' },
  ];
  const label = { img: 'Image', text: 'Text', film: 'Video', canvas: 'Image', video: 'Video' };

  // Small seeded random so the AI images look the same on every visit
  function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function drawArt(cv, seed, t) {
    const r = rng(seed), ctx = cv.getContext('2d'), w = cv.width, h = cv.height;
    const hue = (seed * 67) % 360; r(); r();
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, `hsl(${hue},55%,82%)`); g.addColorStop(1, `hsl(${(hue + 60) % 360},60%,62%)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.fillStyle = `hsla(${(hue + i * 25) % 360},70%,${45 + r() * 30}%,0.55)`;
      const x = r() * w + Math.sin((t || 0) / 700 + i) * 6, y = r() * h + Math.cos((t || 0) / 900 + i) * 6;
      ctx.arc(x, y, 8 + r() * w * 0.22, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, r() * h); ctx.bezierCurveTo(w * 0.3, r() * h, w * 0.7, r() * h, w, r() * h); ctx.stroke(); }
  }

  const cards = [];
  const animated = [];
  works.forEach((wk, i) => {
    const el = document.createElement('div');
    el.className = `work work--${wk.who}`;
    el.style.setProperty('--w', `${8.2 + ((i * 37) % 30) / 10}rem`);
    let media;
    if (wk.kind === 'img') { media = new Image(); media.src = wk.src; media.alt = wk.alt; media.loading = 'lazy'; }
    else if (wk.kind === 'text') { media = document.createElement('span'); media.className = 'work__text'; media.textContent = wk.text; }
    else if (wk.kind === 'film') { media = document.createElement('span'); media.className = 'work__film'; media.setAttribute('role', 'img'); media.setAttribute('aria-label', wk.alt); }
    else { media = document.createElement('canvas'); media.width = 240; media.height = wk.kind === 'video' ? 150 : 300; drawArt(media, wk.seed, 0); if (wk.kind === 'video' && !reduce) animated.push([media, wk.seed]); }
    el.innerHTML = `<span class="work__inner"><span class="work__face"></span><span class="work__face work__back"><span class="work__who">${wk.who === 'ai' ? 'AI' : 'Human'}</span><span class="work__how">${wk.how}</span></span></span>`;
    const face = el.querySelector('.work__face');
    face.appendChild(media);
    const cap = document.createElement('span'); cap.className = 'work__cap'; cap.textContent = label[wk.kind];
    face.appendChild(cap);
    field.appendChild(el);
    cards.push({ el, timer: 0 });
  });

  // Scatter around the edges, leaving the centre for the title
  function scatter() {
    const W = field.clientWidth, H = field.clientHeight;
    const n = cards.length;
    cards.forEach((c, i) => {
      const a = (i / n) * Math.PI * 2 + 0.3;
      const rx = W * (0.36 + ((i * 13) % 7) / 70), ry = H * (0.34 + ((i * 7) % 5) / 50);
      const cw = c.el.offsetWidth, ch = c.el.offsetHeight;
      const x = Math.max(-cw * 0.25, Math.min(W - cw * 0.75, W / 2 + Math.cos(a) * rx - cw / 2));
      const y = Math.max(-ch * 0.2, Math.min(H - ch * 0.8, H / 2 + Math.sin(a) * ry - ch / 2));
      c.el.style.left = `${x}px`; c.el.style.top = `${y}px`;
      c.el.style.transform = `rotate(${(((i * 53) % 13) - 6)}deg)`;
      c.cx = x + cw / 2; c.cy = y + ch / 2;
    });
  }
  window.addEventListener('load', scatter);
  window.addEventListener('resize', scatter);
  scatter();

  function flip(c, delay) {
    if (c.el.classList.contains('is-flipped') || c.pending) return;
    c.pending = setTimeout(() => {
      c.pending = 0;
      c.el.classList.add('is-flipped');
      clearTimeout(c.timer);
      c.timer = setTimeout(() => c.el.classList.remove('is-flipped'), 1800);
    }, delay);
  }

  function wave(px, py, radius) {
    for (const c of cards) {
      const d = Math.hypot(c.cx - px, c.cy - py);
      if (d < radius) flip(c, d * (reduce ? 0 : 1.6));
    }
  }

  const hero = field.closest('.wall-hero');
  let last = 0;
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const now = performance.now();
    if (now - last < 60) return;
    last = now;
    const r = field.getBoundingClientRect();
    wave(e.clientX - r.left, e.clientY - r.top, 260);
  });
  // On touch, a tap sends a wave across the whole wall
  hero.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    const r = field.getBoundingClientRect();
    wave(e.clientX - r.left, e.clientY - r.top, 2000);
  });

  if (animated.length) {
    const loop = (t) => { animated.forEach(([cv, seed]) => drawArt(cv, seed, t)); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
})();
