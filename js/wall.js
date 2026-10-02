// Wall of works. A card flips when the pointer passes over it (or when it is tapped) to show
// whether a person or an AI made it, then turns back. Sweeping across the wall makes a wave.
(function () {
  const field = document.querySelector('[data-wall]');
  if (!field) return;

  // Human works: public-domain pieces from Wikimedia Commons.
  // AI works: made for this page with Gemini and Veo from one prompt each; the two short texts were written by Claude.
  const works = [
    { who: 'human', kind: 'img', label: 'Print', src: 'hokusai.jpg', alt: 'The Great Wave off Kanagawa', how: 'Hokusai, c. 1831' },
    { who: 'ai', kind: 'img', label: 'Print', src: 'ai_rain.jpg', alt: 'A woodblock-style print of travellers on a snowy mountain road', how: 'Gemini, c. 10 seconds' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'vangogh.jpg', alt: 'The Starry Night', how: 'Van Gogh, 1889' },
    { who: 'ai', kind: 'text', text: '“Patience” is the thing with roots – / That holds the ground below – / It does not ask the rain to come – / But waits, and lets it go –', how: 'Claude, asked to write like Dickinson' },
    { who: 'human', kind: 'film', alt: 'The Horse in Motion', how: 'Muybridge, 1878' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_portrait.jpg', alt: 'A Dutch-style painting of a young man writing a letter', how: 'Gemini, c. 10 seconds' },
    { who: 'human', kind: 'text', text: '“Hope” is the thing with feathers – / That perches in the soul – / And sings the tune without the words – / And never stops – at all –', how: 'Emily Dickinson, c. 1861' },
    { who: 'ai', kind: 'img', label: 'Print', src: 'ai_wave.jpg', alt: 'A woodblock-style print of a fishing village in a storm', how: 'Gemini, c. 10 seconds' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'vermeer.jpg', alt: 'Girl with a Pearl Earring', how: 'Vermeer, c. 1665' },
    { who: 'ai', kind: 'video', src: 'ai_horse.mp4', alt: 'A galloping horse in the style of 1870s photography', how: 'Veo, c. a minute' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'monet.jpg', alt: 'Impression, Sunrise', how: 'Monet, 1872' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_night.jpg', alt: 'A lighthouse on a rocky coast under a swirling night sky', how: 'Gemini, c. 10 seconds' },
    { who: 'human', kind: 'img', label: 'Print', src: 'hiroshige.jpg', alt: 'Sudden Shower over Shin-Ohashi Bridge', how: 'Hiroshige, 1857' },
    { who: 'ai', kind: 'text', text: 'I wander through the city, and the city wanders through me, / And every window I pass is a face I have not met.', how: 'Claude, asked to write like Whitman' },
    { who: 'human', kind: 'text', text: 'I celebrate myself, and sing myself, / And what I assume you shall assume, / For every atom belonging to me as good belongs to you.', how: 'Walt Whitman, 1855' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_harbor.jpg', alt: 'An impressionist harbor at sunrise', how: 'Gemini, c. 10 seconds' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'klimt.jpg', alt: 'The Kiss', how: 'Klimt, 1908' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_park.jpg', alt: 'A pointillist beach on a summer day', how: '' },
    { who: 'human', kind: 'text', text: 'Tyger Tyger, burning bright, / In the forests of the night; / What immortal hand or eye, / Could frame thy fearful symmetry?', how: 'William Blake, 1794' },
    { who: 'ai', kind: 'img', label: 'Print', src: 'ai_redmount.jpg', alt: 'A woodblock-style print of a pagoda by a lake at sunset', how: '' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'botticelli.jpg', alt: 'The Birth of Venus', how: 'Botticelli, c. 1485' },
    { who: 'ai', kind: 'text', text: 'Shall I compare thee to an autumn rain? / Thou art more patient, and more plain. / So long as clouds can gather, roofs can ring, / So long lives this, and quiet things it brings.', how: '' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'rembrandt.jpg', alt: 'Self-Portrait', how: 'Rembrandt, 1659' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_shell.jpg', alt: 'A young woman picking oranges while angels play music', how: '' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'seurat.jpg', alt: 'A Sunday on La Grande Jatte', how: 'Seurat, 1884' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_oldman.jpg', alt: 'A portrait of an elderly woman with a lace collar', how: '' },
    { who: 'human', kind: 'text', text: 'Shall I compare thee to a summer\u2019s day? / Thou art more lovely and more temperate. / So long as men can breathe or eyes can see, / So long lives this, and this gives life to thee.', how: 'Shakespeare, 1609' },
    { who: 'ai', kind: 'text', text: 'Fox, O fox, running bright / Through the hedges of the night; / What quiet field or hidden den / Could hold you still till morning then?', how: '' },
    { who: 'human', kind: 'sound', src: 'satie.mp3', art: 'satie_wave.jpg', alt: 'Gymnopedie No. 1', how: 'Satie, 1888' },
    { who: 'ai', kind: 'sound', src: 'ai_rag.mp3', art: 'ai_rag_wave.jpg', alt: 'A ragtime piano piece', how: '' },
    { who: 'human', kind: 'sound', src: 'joplin.mp3', art: 'joplin_wave.jpg', alt: 'Maple Leaf Rag', how: 'Scott Joplin, 1916' },
    { who: 'ai', kind: 'sound', src: 'ai_waltz.mp3', art: 'ai_waltz_wave.jpg', alt: 'A slow piano waltz', how: '' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'jeongseon.jpg', alt: 'Inwang Jesaekdo, Clearing after Rain on Mount Inwang', how: 'Jeong Seon, 1751' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_pungsok.jpg', alt: 'A Joseon-style genre painting of a riverside market', how: '' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'kimhongdo.jpg', alt: 'Seodang, a village schoolroom', how: 'Kim Hong-do, c. 1780' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_miin.jpg', alt: 'A Joseon-style portrait of a woman in hanbok holding a fan', how: '' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_jinkyeong.jpg', alt: 'A Joseon-style ink landscape of misty peaks', how: '' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'chaekgado.jpg', alt: 'Chaekgado, a Korean bookshelf painting', how: 'Joseon folk painting, 1800s' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_chaekgado.jpg', alt: 'A chaekgado-style bookshelf painting', how: '' },
    { who: 'human', kind: 'sound', src: 'bach.mp3', art: 'bach_wave.jpg', alt: 'Prelude in C major, BWV 846', how: 'Bach, played by Kimiko Ishizaka' },
    { who: 'ai', kind: 'sound', src: 'ai_prelude.mp3', art: 'ai_prelude_wave.jpg', alt: 'A Baroque-style piano prelude', how: '' },
    { who: 'human', kind: 'sound', src: 'chopin.mp3', art: 'chopin_wave.jpg', alt: 'Nocturne in E-flat major, Op. 9 No. 2', how: 'Chopin, 1832' },
    { who: 'ai', kind: 'sound', src: 'ai_nocturne.mp3', art: 'ai_nocturne_wave.jpg', alt: 'A romantic-style piano nocturne', how: '' },
    { who: 'human', kind: 'video', src: 'lumiere_train.mp4', alt: 'Arrival of a Train at La Ciotat', how: 'Lumi\u00e8re brothers, 1895' },
    { who: 'ai', kind: 'video', src: 'ai_tram.mp4', alt: 'A horse-drawn tram in 1890s film style', how: '' },
    { who: 'human', kind: 'video', src: 'lumiere_factory.mp4', alt: 'Workers Leaving the Lumi\u00e8re Factory', how: 'Lumi\u00e8re brothers, 1895' },
    { who: 'ai', kind: 'video', src: 'ai_market.mp4', alt: 'A crowd leaving a church in 1890s film style', how: '' },
    { who: 'human', kind: 'video', src: 'melies_moon.mp4', alt: 'A Trip to the Moon', how: 'Georges M\u00e9li\u00e8s, 1902' },
    { who: 'ai', kind: 'video', src: 'ai_fantasy.mp4', alt: 'A stage trick film with a paper moon', how: '' },
  ];
  // Fixed layout: one chosen seed gives the same order and placement on every visit (?seed=N previews others)
  const SEED = Number(new URLSearchParams(location.search).get('seed')) || 3;
  const shuffleRand = (() => { let t = SEED >>> 0; return () => { t = (t + 0x6D2B79F5) >>> 0; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; })();
  for (let i = works.length - 1; i > 0; i--) { const j = Math.floor(shuffleRand() * (i + 1)); [works[i], works[j]] = [works[j], works[i]]; }
  const base = field.dataset.wall || 'assets/works/';
  const label = { img: 'Image', text: 'Poem', film: 'Video', video: 'Video', sound: 'Music' };
  const cards = [];

  works.forEach((wk, i) => {
    const el = document.createElement('div');
    el.className = `work work--${wk.who}`;
    const GROUPS = {"ai_horse": "horse", "lumiere_train": "film-train", "ai_tram": "film-train", "lumiere_factory": "film-crowd", "ai_market": "film-crowd", "melies_moon": "film-trick", "ai_fantasy": "film-trick", "vangogh": "vangogh", "ai_night": "vangogh", "hokusai": "ukiyoe", "ai_wave": "ukiyoe", "hiroshige": "ukiyoe", "ai_rain": "ukiyoe", "ai_redmount": "ukiyoe", "monet": "impression", "ai_harbor": "impression", "vermeer": "dutch", "ai_portrait": "dutch", "rembrandt": "dutch", "ai_oldman": "dutch", "botticelli": "renaissance", "ai_shell": "renaissance", "seurat": "pointillism", "ai_park": "pointillism", "klimt": "klimt", "jeongseon": "korean-ink", "ai_jinkyeong": "korean-ink", "kimhongdo": "korean-genre", "ai_pungsok": "korean-genre", "ai_miin": "korean-genre", "chaekgado": "chaekgado", "ai_chaekgado": "chaekgado"};
    el.dataset.group = wk.kind === 'sound' ? 'music' : wk.kind === 'text' ? 'poem' : wk.kind === 'film' ? 'horse' : (GROUPS[(wk.src || '').replace(/\.\w+$/, '')] || wk.src);
    el.style.setProperty('--w', `${8.4 + ((i * 37) % 30) / 10}rem`);
    let media;
    if (wk.kind === 'img') {
      media = new Image(); if (wk.w) { media.width = wk.w; media.height = wk.h; } media.src = base + wk.src; media.alt = wk.alt; media.draggable = false;
    } else if (wk.kind === 'text') {
      media = document.createElement('span'); media.className = 'work__text'; media.textContent = wk.text.split(' / ').join('\n');
    } else if (wk.kind === 'film') {
      media = document.createElement('span'); media.className = 'work__film'; media.setAttribute('role', 'img'); media.setAttribute('aria-label', wk.alt);
    } else if (wk.kind === 'sound') {
      media = document.createElement('span'); media.className = 'work__sound';
      media.innerHTML = `<img src="${base + wk.art}" alt="" draggable="false"><span class="work__play" aria-hidden="true"></span>`;
      const audio = new Audio(base + wk.src); audio.preload = 'none';
      media.dataset.sound = '1';
      el.addEventListener('click', (e) => {
        e.stopImmediatePropagation();
        const playing = !audio.paused;
        document.querySelectorAll('.work.is-playing').forEach((w) => { w._audio.pause(); });
        if (!playing) { audio.currentTime = 0; audio.play(); el.classList.add('is-playing'); }
        if (e.pointerType !== 'mouse') el.classList.add('is-flipped');
      });
      const stop = () => { el.classList.remove('is-playing'); if (!el.matches(':hover')) el.classList.remove('is-flipped'); };
      audio.addEventListener('ended', stop);
      audio.addEventListener('pause', stop);
      el._audio = audio;
      el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0'); el.setAttribute('aria-label', `Play ${wk.alt}`);
    } else {
      media = document.createElement('video'); if (wk.w) { media.width = wk.w; media.height = wk.h; }
      Object.assign(media, { src: base + wk.src, muted: true, loop: true, autoplay: true, playsInline: true });
      media.setAttribute('aria-label', wk.alt);
    }
    el.innerHTML = `<span class="work__inner"><span class="work__face"></span><span class="work__face work__back">${wk.kind === 'sound' ? `<span class="work__sound work__sound--back"><img src="${base + wk.art.replace('_wave.jpg', '_wave_t.png')}" alt="" draggable="false"><span class="work__play" aria-hidden="true"></span></span>` : ''}<span class="work__who">${wk.who === 'ai' ? 'AI' : 'Human'}</span>${wk.who === 'human' ? `<span class="work__how">${wk.how}</span>` : ''}</span></span>`;
    const face = el.querySelector('.work__face');
    face.appendChild(media);
    // Faint copy of the front on the back (images, video, poems), in the same place and size
    if (wk.kind !== 'sound') {
      const ghost = media.cloneNode(true);
      ghost.classList.add('work__ghost');
      ghost.removeAttribute('alt'); ghost.setAttribute('aria-hidden', 'true');
      if (ghost.tagName === 'VIDEO') { ghost.muted = true; ghost.loop = true; ghost.autoplay = true; ghost.playsInline = true; }
      el.querySelector('.work__back').prepend(ghost);
    }
    field.appendChild(el);
    const card = { el, timer: 0 };
    cards.push(card);

    el.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      // Only one card is active at a time: put any other card back right away
      cards.forEach((o) => {
        if (o === card || o.el.classList.contains('is-playing')) return;
        clearTimeout(o.timer); clearTimeout(o.lower);
        o.el.classList.remove('is-flipped', 'is-raised');
      });
      clearTimeout(card.timer); clearTimeout(card.lower);
      el.classList.add('is-raised');
      card.timer = setTimeout(() => { if (!el.classList.contains('is-flipped') && window.flipSound) window.flipSound(); el.classList.add('is-flipped'); }, 160);
    });
    el.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse' || el.classList.contains('is-playing')) return;
      clearTimeout(card.timer);
      card.timer = setTimeout(() => el.classList.remove('is-flipped'), 200);
      card.lower = setTimeout(() => el.classList.remove('is-raised'), 800);
    });
    if (wk.kind !== 'sound') el.addEventListener('click', () => flip(card));
  });

  function flip(c) {
    if (!c.el.classList.contains('is-flipped') && window.flipSound) window.flipSound();
    c.el.classList.add('is-flipped');
    clearTimeout(c.timer);
    c.timer = setTimeout(() => c.el.classList.remove('is-flipped'), 900);
  }

  // Place cards around the title. Each card tries many spots and takes the one that
  // overlaps least; a card that cannot find a spot with little overlap is hidden (small screens).
  function rand(seed) { let t = seed >>> 0; return () => { t = (t + 0x6D2B79F5) >>> 0; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  function overlap(a, b) {
    const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return w > 0 && h > 0 ? w * h : 0;
  }
  function scatter() {
    const W = field.clientWidth, H = field.clientHeight;
    const small = W < 640;
    // Reserve only the area the title text actually covers, not the whole title box
    const tb = document.querySelector('.wall-title__box');
    const rg = document.createRange(); rg.selectNodeContents(tb);
    const rects = [...rg.getClientRects()].filter((q) => q.width > 2 && q.height > 2);
    const box = rects.length ? rects.reduce((u, q) => ({ left: Math.min(u.left, q.left), top: Math.min(u.top, q.top), right: Math.max(u.right, q.right), bottom: Math.max(u.bottom, q.bottom) }),
      { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }) : tb.getBoundingClientRect();
    box.width = box.right - box.left; box.height = box.bottom - box.top;
    const f = field.getBoundingClientRect();
    const pad = small ? 6 : 14;
    const title = { x: box.left - f.left - pad, y: box.top - f.top - pad, w: box.width + pad * 2, h: box.height + pad * 2 };
    const r = rand(SEED * 7919);
    // Jittered grid: pick the smallest cell size whose free cells (not under the title) do not
    // outnumber the cards, so the wall is always full whatever the screen size
    let cells = [];
    for (let cell = small ? 90 : 130; cell < 400; cell += 6) {
      const cols = Math.max(2, Math.round(W / cell)), rows = Math.max(2, Math.round(H / cell));
      const cw0 = W / cols, ch0 = H / rows;
      cells = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const c = { x: x * cw0, y: y * ch0, w: cw0, h: ch0 };
        const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
        if (cx > title.x && cx < title.x + title.w && cy > title.y && cy < title.y + title.h) continue;
        cells.push(c);
      }
      if (cells.length <= cards.length) break;
    }
    for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    const placed = [];
    cards.forEach((c, i) => {
      c.el.style.display = '';
      c.el.style.setProperty('--w', small ? `${7 + (i % 3) * 0.5}rem` : `${15 + ((i * 37) % 22) / 10}rem`);
      let slot = null;
      if (cells.length) {
        const mates = placed.filter((p) => p.g === c.el.dataset.group);
        let best = -1, bi = 0;
        cells.forEach((cl, ci) => {
          const cx = cl.x + cl.w / 2, cy = cl.y + cl.h / 2;
          const d = mates.length ? Math.min(...mates.map((p) => Math.hypot(p.x + p.w / 2 - cx, p.y + p.h / 2 - cy))) : 1e9;
          const sc = Math.min(d, 900) + r() * 40;
          if (sc > best) { best = sc; bi = ci; }
        });
        slot = cells.splice(bi, 1)[0];
      }
      if (slot) {
        // Fit the card to its cell so neighbours never bury each other
        let cw0 = c.el.offsetWidth, ch0 = c.el.offsetHeight;
        const k = Math.min(1, (slot.w * (1.15 + r() * 0.35)) / cw0, (slot.h * (1.2 + r() * 0.35)) / ch0);
        if (k < 1) c.el.style.setProperty('--w', `${(cw0 * k) / 16}rem`);
      }
      const cw = c.el.offsetWidth, ch = c.el.offsetHeight;
      if (!slot) { c.el.style.display = 'none'; return; }
      // Try a few nudges inside the cell; fall back to the centre of the cell so no cell is left empty
      let rect = null;
      for (let k = 0; k < 8 && !rect; k++) {
        const j = k < 7 ? 0.95 : 0;
        let x = slot.x + (slot.w - cw) / 2 + (r() - 0.5) * slot.w * j;
        let y = slot.y + (slot.h - ch) / 2 + (r() - 0.5) * slot.h * j;
        x = Math.max(-cw * 0.15, Math.min(W - cw * 0.85, x));
        y = Math.max(-ch * 0.1, Math.min(H - ch * 0.85, y));
        const cand = { x, y, w: cw, h: ch };
        let bad = overlap(cand, title) > cw * ch * 0.05;
        for (const p of placed) if (overlap(cand, p) / Math.min(cw * ch, p.w * p.h) > 0.38) bad = true;
        if (!bad || k === 7) rect = cand;
      }
      if (overlap(rect, title) > cw * ch * 0.05) { c.el.style.display = 'none'; return; }
      const x = rect.x, y = rect.y;
      rect.g = c.el.dataset.group; placed.push(rect);
      c.el.style.left = `${x}px`; c.el.style.top = `${y}px`;
      c.el.style.transform = `rotate(${((r() - 0.5) * 16).toFixed(1)}deg)`;
    });
  }

  // Lay out again once every image has its real size
  // Lay out once, after images and fonts are ready, then bring the cards in one by one
  const ready = Promise.all([
    ...[...field.querySelectorAll('img')].map((im) => (im.complete ? Promise.resolve() : im.decode().catch(() => {}))),
    document.fonts ? document.fonts.ready : Promise.resolve(),
  ]);
  const reveal = () => {
    scatter();
    const W = field.clientWidth / 2, H = field.clientHeight / 2;
    const shown = cards.filter((c) => c.el.style.display !== 'none');
    shown.sort((a, b) => Math.hypot(a.el.offsetLeft - W, a.el.offsetTop - H) - Math.hypot(b.el.offsetLeft - W, b.el.offsetTop - H));
    shown.forEach((c, i) => { c.el.style.transitionDelay = `${i * 18}ms`; });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      field.classList.add('is-ready');
      setTimeout(() => shown.forEach((c) => { c.el.style.transitionDelay = ''; }), shown.length * 18 + 500);
    }));
  };
  (document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 300))]) : Promise.resolve()).then(reveal);
  window.__wallMetrics = () => {
    const vis = [...field.querySelectorAll('.work')].filter((e) => e.style.display !== 'none');
    const R = vis.map((e) => ({ r: e.getBoundingClientRect(), g: e.dataset.group }));
    let worst = 0, sum = 0, sameAdj = 0;
    for (let i = 0; i < R.length; i++) for (let j = 0; j < i; j++) {
      const a = R[i].r, b = R[j].r;
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      const near = Math.hypot((a.left + a.right - b.left - b.right) / 2, (a.top + a.bottom - b.top - b.bottom) / 2) < 260;
      if (near && R[i].g === R[j].g) sameAdj++;
      if (w > 0 && h > 0) { const o = w * h / Math.min(a.width * a.height, b.width * b.height); worst = Math.max(worst, o); sum += o; }
    }
    return { n: R.length, worst: +worst.toFixed(2), mean: +(sum / R.length).toFixed(3), sameAdj };
  };
  if (new URLSearchParams(location.search).has('metrics')) window.addEventListener('load', () => setTimeout(() => { document.body.dataset.metrics = JSON.stringify(window.__wallMetrics()); }, 300));
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(scatter, 150); });
})();
