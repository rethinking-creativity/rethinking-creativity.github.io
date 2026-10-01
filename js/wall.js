// Wall of works. A card flips when the pointer passes over it (or when it is tapped) to show
// whether a person or an AI made it, then turns back. Sweeping across the wall makes a wave.
(function () {
  const field = document.querySelector('[data-wall]');
  if (!field) return;

  // Human works: public-domain pieces from Wikimedia Commons.
  // AI works: made for this page with Gemini and Veo from one prompt each; the two short texts were written by Claude.
  const works = [
    { who: 'human', kind: 'img', label: 'Print', src: 'hokusai.jpg', alt: 'The Great Wave off Kanagawa', how: 'Hokusai, woodblock print, about 1831' },
    { who: 'ai', kind: 'img', label: 'Print', src: 'ai_rain.jpg', alt: 'A woodblock-style print of travellers on a snowy mountain road', how: 'Gemini, one prompt, about 10 seconds' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'vangogh.jpg', alt: 'The Starry Night', how: 'Van Gogh, oil on canvas, 1889' },
    { who: 'ai', kind: 'text', text: '“Patience” is the thing with roots – / That holds the ground below –', how: 'Claude, asked to write like Dickinson' },
    { who: 'human', kind: 'film', alt: 'The Horse in Motion', how: 'Muybridge, twelve cameras, 1878' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_portrait.jpg', alt: 'A Dutch-style painting of a young man writing a letter', how: 'Gemini, one prompt, about 10 seconds' },
    { who: 'human', kind: 'text', text: '“Hope” is the thing with feathers – / That perches in the soul –', how: 'Emily Dickinson, poem, about 1861' },
    { who: 'ai', kind: 'img', label: 'Print', src: 'ai_wave.jpg', alt: 'A woodblock-style print of a fishing village in a storm', how: 'Gemini, one prompt, about 10 seconds' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'vermeer.jpg', alt: 'Girl with a Pearl Earring', how: 'Vermeer, oil on canvas, about 1665' },
    { who: 'ai', kind: 'video', src: 'ai_horse.mp4', alt: 'A galloping horse in the style of 1870s photography', how: 'Veo, one prompt, about a minute' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'monet.jpg', alt: 'Impression, Sunrise', how: 'Monet, oil on canvas, 1872' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_night.jpg', alt: 'A lighthouse on a rocky coast under a swirling night sky', how: 'Gemini, one prompt, about 10 seconds' },
    { who: 'human', kind: 'img', label: 'Print', src: 'hiroshige.jpg', alt: 'Sudden Shower over Shin-Ohashi Bridge', how: 'Hiroshige, woodblock print, 1857' },
    { who: 'ai', kind: 'text', text: 'I wander through the city, and the city wanders through me,', how: 'Claude, asked to write like Whitman' },
    { who: 'human', kind: 'text', text: 'I celebrate myself, and sing myself, / And what I assume you shall assume,', how: 'Walt Whitman, poem, 1855' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_harbor.jpg', alt: 'An impressionist harbor at sunrise', how: 'Gemini, one prompt, about 10 seconds' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'klimt.jpg', alt: 'The Kiss', how: 'Klimt, oil and gold leaf, 1908' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_park.jpg', alt: 'A pointillist beach on a summer day', how: '' },
    { who: 'human', kind: 'text', text: 'Tyger Tyger, burning bright, / In the forests of the night;', how: 'William Blake, poem, 1794' },
    { who: 'ai', kind: 'img', label: 'Print', src: 'ai_redmount.jpg', alt: 'A woodblock-style print of a pagoda by a lake at sunset', how: '' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'botticelli.jpg', alt: 'The Birth of Venus', how: 'Botticelli, tempera on canvas, about 1485' },
    { who: 'ai', kind: 'text', text: 'Shall I compare thee to an autumn rain? / Thou art more patient, and more plain:', how: '' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'rembrandt.jpg', alt: 'Self-Portrait', how: 'Rembrandt, oil on canvas, 1659' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_gold.jpg', alt: 'A woman reading in a golden ornamented garden', how: '' },
    { who: 'human', kind: 'img', label: 'Print', src: 'redfuji.jpg', alt: 'Fine Wind, Clear Morning', how: 'Hokusai, woodblock print, about 1831' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_shell.jpg', alt: 'A young woman picking oranges while angels play music', how: '' },
    { who: 'human', kind: 'img', label: 'Painting', src: 'seurat.jpg', alt: 'A Sunday on La Grande Jatte', how: 'Seurat, oil on canvas, 1884' },
    { who: 'ai', kind: 'img', label: 'Painting', src: 'ai_oldman.jpg', alt: 'A portrait of an elderly woman with a lace collar', how: '' },
    { who: 'human', kind: 'text', text: 'Shall I compare thee to a summer\u2019s day? / Thou art more lovely and more temperate:', how: 'Shakespeare, sonnet, 1609' },
    { who: 'ai', kind: 'text', text: 'Fox, O fox, running bright / Through the hedges of the night;', how: '' },
    { who: 'human', kind: 'sound', src: 'satie.mp3', art: 'satie_wave.jpg', alt: 'Gymnopedie No. 1', how: 'Satie, piano, 1888' },
    { who: 'ai', kind: 'sound', src: 'ai_rag.mp3', art: 'ai_rag_wave.jpg', alt: 'A ragtime piano piece', how: '' },
    { who: 'human', kind: 'sound', src: 'joplin.mp3', art: 'joplin_wave.jpg', alt: 'Maple Leaf Rag', how: 'Scott Joplin, piano roll, 1916' },
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
    const cap = document.createElement('span'); cap.className = 'work__cap'; cap.textContent = wk.label || label[wk.kind];
    face.appendChild(cap);
    field.appendChild(el);
    const card = { el, timer: 0 };
    cards.push(card);

    el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { clearTimeout(card.timer); el.classList.add('is-flipped'); } });
    el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { clearTimeout(card.timer); card.timer = setTimeout(() => el.classList.remove('is-flipped'), 250); } });
    if (wk.kind !== 'sound') el.addEventListener('click', () => flip(card));
  });

  function flip(c) {
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
    const pad = small ? 8 : 18;
    // Reserve the title's final size (it is still typing when this runs)
    const tw = Math.max(box.width, Math.min(W * (small ? 0.94 : 0.62), 880)) + pad * 2;
    const th = box.height + pad * 2;
    const title = { x: W / 2 - tw / 2, y: (box.top - f.top) + box.height / 2 - th / 2, w: tw, h: th };
    const r = rand(7);
    const placed = [];
    cards.forEach((c, i) => {
      c.el.style.display = '';
      c.el.style.setProperty('--w', small ? `${5.4 + (i % 3) * 0.5}rem` : `${7.4 + ((i * 37) % 20) / 10}rem`);
      const cw = c.el.offsetWidth, ch = c.el.offsetHeight;
      const area = cw * ch;
      let best = null, bestWorst = Infinity, bestSum = Infinity;
      for (let k = 0; k < 260; k++) {
        const cand = { x: r() * (W - cw * 0.75) - cw * 0.12, y: r() * (H - ch * 0.8) - ch * 0.08, w: cw, h: ch };
        if (overlap(cand, title) > 0) continue;
        // Worst pairwise overlap, as a share of the smaller card
        let worst = 0, sum = 0;
        for (const p of placed) {
          const o = overlap(cand, p);
          if (!o) continue;
          sum += o;
          worst = Math.max(worst, o / Math.min(area, p.w * p.h));
        }
        if (worst < bestWorst || (worst === bestWorst && sum < bestSum)) { bestWorst = worst; bestSum = sum; best = cand; }
        if (worst === 0) break;
      }
      // Keep only cards that overlap their neighbours by a small corner at most
      const ok = best && bestWorst <= 0.1;
      if (!ok) { c.el.style.display = 'none'; return; }
      placed.push(best);
      c.el.style.left = `${best.x}px`; c.el.style.top = `${best.y}px`;
      c.el.style.transform = `rotate(${(((i * 53) % 11) - 5)}deg)`;
    });
  }
  // Lay out again once every image has its real size
  Promise.all([...field.querySelectorAll('img')].map((im) => (im.complete ? Promise.resolve() : im.decode().catch(() => {})))).then(scatter);
  window.addEventListener('load', scatter);
  window.addEventListener('resize', scatter);
  scatter();
})();
