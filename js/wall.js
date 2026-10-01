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
    { who: 'ai', kind: 'text', text: '“Patience” is the thing with roots – / That holds the ground below –', how: 'Claude, asked to write like Dickinson' },
    { who: 'human', kind: 'film', alt: 'The Horse in Motion', how: 'Muybridge, 1878' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_portrait.jpg', alt: 'A Dutch-style painting of a young man writing a letter', how: 'Gemini, c. 10 seconds' },
    { who: 'human', kind: 'text', text: '“Hope” is the thing with feathers – / That perches in the soul –', how: 'Emily Dickinson, c. 1861' },
    { who: 'ai', kind: 'img', label: 'Print', src: 'ai_wave.jpg', alt: 'A woodblock-style print of a fishing village in a storm', how: 'Gemini, c. 10 seconds' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'vermeer.jpg', alt: 'Girl with a Pearl Earring', how: 'Vermeer, c. 1665' },
    { who: 'ai', kind: 'video', src: 'ai_horse.mp4', alt: 'A galloping horse in the style of 1870s photography', how: 'Veo, c. a minute' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'monet.jpg', alt: 'Impression, Sunrise', how: 'Monet, 1872' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_night.jpg', alt: 'A lighthouse on a rocky coast under a swirling night sky', how: 'Gemini, c. 10 seconds' },
    { who: 'human', kind: 'img', label: 'Print', src: 'hiroshige.jpg', alt: 'Sudden Shower over Shin-Ohashi Bridge', how: 'Hiroshige, 1857' },
    { who: 'ai', kind: 'text', text: 'I wander through the city, and the city wanders through me,', how: 'Claude, asked to write like Whitman' },
    { who: 'human', kind: 'text', text: 'I celebrate myself, and sing myself, / And what I assume you shall assume,', how: 'Walt Whitman, 1855' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_harbor.jpg', alt: 'An impressionist harbor at sunrise', how: 'Gemini, c. 10 seconds' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'klimt.jpg', alt: 'The Kiss', how: 'Klimt, 1908' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_park.jpg', alt: 'A pointillist beach on a summer day', how: '' },
    { who: 'human', kind: 'text', text: 'Tyger Tyger, burning bright, / In the forests of the night;', how: 'William Blake, 1794' },
    { who: 'ai', kind: 'img', label: 'Print', src: 'ai_redmount.jpg', alt: 'A woodblock-style print of a pagoda by a lake at sunset', how: '' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'botticelli.jpg', alt: 'The Birth of Venus', how: 'Botticelli, c. 1485' },
    { who: 'ai', kind: 'text', text: 'Shall I compare thee to an autumn rain? / Thou art more patient, and more plain:', how: '' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'rembrandt.jpg', alt: 'Self-Portrait', how: 'Rembrandt, 1659' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_gold.jpg', alt: 'A woman reading in a golden ornamented garden', how: '' },
    { who: 'human', kind: 'img', label: 'Print', src: 'redfuji.jpg', alt: 'Fine Wind, Clear Morning', how: 'Hokusai, c. 1831' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_shell.jpg', alt: 'A young woman picking oranges while angels play music', how: '' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'seurat.jpg', alt: 'A Sunday on La Grande Jatte', how: 'Seurat, 1884' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_oldman.jpg', alt: 'A portrait of an elderly woman with a lace collar', how: '' },
    { who: 'human', kind: 'text', text: 'Shall I compare thee to a summer\u2019s day? / Thou art more lovely and more temperate:', how: 'Shakespeare, 1609' },
    { who: 'ai', kind: 'text', text: 'Fox, O fox, running bright / Through the hedges of the night;', how: '' },
    { who: 'human', kind: 'sound', src: 'satie.mp3', art: 'satie_wave.jpg', alt: 'Gymnopedie No. 1', how: 'Satie, 1888' },
    { who: 'ai', kind: 'sound', src: 'ai_rag.mp3', art: 'ai_rag_wave.jpg', alt: 'A ragtime piano piece', how: '' },
    { who: 'human', kind: 'sound', src: 'joplin.mp3', art: 'joplin_wave.jpg', alt: 'Maple Leaf Rag', how: 'Scott Joplin, 1916' },
    { who: 'ai', kind: 'sound', src: 'ai_waltz.mp3', art: 'ai_waltz_wave.jpg', alt: 'A slow piano waltz', how: '' },
  ];
  const base = field.dataset.wall || 'assets/works/';
  const label = { img: 'Image', text: 'Poem', film: 'Video', video: 'Video', sound: 'Music' };
  const cards = [];

  works.forEach((wk, i) => {
    const el = document.createElement('div');
    el.className = `work work--${wk.who}`;
    el.style.setProperty('--w', `${8.4 + ((i * 37) % 30) / 10}rem`);
    let media;
    if (wk.kind === 'img') {
      media = new Image(); media.src = base + wk.src; media.alt = wk.alt; media.draggable = false;
    } else if (wk.kind === 'text') {
      media = document.createElement('span'); media.className = 'work__text'; media.textContent = wk.text;
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
        document.querySelectorAll('.work.is-playing').forEach((w) => { w._audio.pause(); w.classList.remove('is-playing'); });
        if (!playing) { audio.currentTime = 0; audio.play(); el.classList.add('is-playing'); }
      });
      audio.addEventListener('ended', () => el.classList.remove('is-playing'));
      el._audio = audio;
      el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0'); el.setAttribute('aria-label', `Play ${wk.alt}`);
    } else {
      media = document.createElement('video');
      Object.assign(media, { src: base + wk.src, muted: true, loop: true, autoplay: true, playsInline: true });
      media.setAttribute('aria-label', wk.alt);
    }
    el.innerHTML = `<span class="work__inner"><span class="work__face"></span><span class="work__face work__back"><span class="work__who">${wk.who === 'ai' ? 'AI' : 'Human'}</span>${wk.who === 'human' ? `<span class="work__how">${wk.how}</span>` : ''}</span></span>`;
    const face = el.querySelector('.work__face');
    face.appendChild(media);
    field.appendChild(el);
    const card = { el, timer: 0 };
    cards.push(card);

    el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { clearTimeout(card.timer); if (!el.classList.contains('is-flipped') && window.flipSound) window.flipSound(); el.classList.add('is-flipped'); } });
    el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { clearTimeout(card.timer); card.timer = setTimeout(() => el.classList.remove('is-flipped'), 250); } });
    if (wk.kind !== 'sound') el.addEventListener('click', () => flip(card));
  });

  function flip(c) {
    if (!c.el.classList.contains('is-flipped') && window.flipSound) window.flipSound();
    c.el.classList.add('is-flipped');
    clearTimeout(c.timer);
    c.timer = setTimeout(() => c.el.classList.remove('is-flipped'), 1600);
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
    const box = document.querySelector('.wall-title__box').getBoundingClientRect();
    const f = field.getBoundingClientRect();
    const pad = small ? 8 : 20;
    const title = { x: box.left - f.left - pad, y: box.top - f.top - pad, w: box.width + pad * 2, h: box.height + pad * 2 };
    const r = rand(11);
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
      c.el.style.setProperty('--w', small ? `${7 + (i % 3) * 0.5}rem` : `${13 + ((i * 37) % 22) / 10}rem`);
      const slot = cells[i];
      if (slot) {
        // Fit the card to its cell so neighbours never bury each other
        let cw0 = c.el.offsetWidth, ch0 = c.el.offsetHeight;
        const k = Math.min(1, (slot.w * 1.05) / cw0, (slot.h * 1.1) / ch0);
        if (k < 1) c.el.style.setProperty('--w', `${(cw0 * k) / 16}rem`);
      }
      const cw = c.el.offsetWidth, ch = c.el.offsetHeight;
      if (!slot) { c.el.style.display = 'none'; return; }
      // Try a few nudges inside the cell; fall back to the centre of the cell so no cell is left empty
      let rect = null;
      for (let k = 0; k < 8 && !rect; k++) {
        const j = k < 7 ? 0.5 : 0;
        let x = slot.x + (slot.w - cw) / 2 + (r() - 0.5) * slot.w * j;
        let y = slot.y + (slot.h - ch) / 2 + (r() - 0.5) * slot.h * j;
        x = Math.max(-cw * 0.15, Math.min(W - cw * 0.85, x));
        y = Math.max(-ch * 0.1, Math.min(H - ch * 0.85, y));
        const cand = { x, y, w: cw, h: ch };
        let bad = overlap(cand, title) > cw * ch * 0.05;
        for (const p of placed) if (overlap(cand, p) / Math.min(cw * ch, p.w * p.h) > 0.18) bad = true;
        if (!bad || k === 7) rect = cand;
      }
      if (overlap(rect, title) > cw * ch * 0.05) { c.el.style.display = 'none'; return; }
      const x = rect.x, y = rect.y;
      placed.push(rect);
      c.el.style.left = `${x}px`; c.el.style.top = `${y}px`;
      c.el.style.transform = `rotate(${((r() - 0.5) * 10).toFixed(1)}deg)`;
    });
  }

  // Lay out again once every image has its real size
  Promise.all([...field.querySelectorAll('img')].map((im) => (im.complete ? Promise.resolve() : im.decode().catch(() => {})))).then(scatter);
  window.addEventListener('load', scatter);
  window.addEventListener('resize', scatter);
  scatter();
})();
