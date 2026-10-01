// Wall of works. A card flips when the pointer passes over it (or when it is tapped) to show
// whether a person or an AI made it, then turns back. Sweeping across the wall makes a wave.
(function () {
  const field = document.querySelector('[data-wall]');
  if (!field) return;

  // Human works: public-domain pieces from Wikimedia Commons.
  // AI works: made for this page with Gemini and Veo from one prompt each; the two short texts were written by Claude.
  const works = [
    { who: 'human', kind: 'img', src: 'hokusai.jpg', alt: 'The Great Wave off Kanagawa', how: 'Hokusai, woodblock print, about 1831' },
    { who: 'ai', kind: 'img', src: 'ai_rain.jpg', alt: 'A woodblock-style print of a bridge in heavy rain', how: 'Gemini, one prompt, about 10 seconds' },
    { who: 'human', kind: 'img', src: 'vangogh.jpg', alt: 'The Starry Night', how: 'Van Gogh, oil on canvas, 1889' },
    { who: 'ai', kind: 'text', text: '“Patience” is the thing with roots – / That holds the ground below –', how: 'Claude, asked to write like Dickinson' },
    { who: 'human', kind: 'film', alt: 'The Horse in Motion', how: 'Muybridge, twelve cameras, 1878' },
    { who: 'ai', kind: 'img', src: 'ai_portrait.jpg', alt: 'A Dutch-style portrait of a woman in a turban', how: 'Gemini, one prompt, about 10 seconds' },
    { who: 'human', kind: 'text', text: '“Hope” is the thing with feathers – / That perches in the soul –', how: 'Emily Dickinson, poem, about 1861' },
    { who: 'ai', kind: 'img', src: 'ai_wave.jpg', alt: 'A woodblock-style print of a great wave', how: 'Gemini, one prompt, about 10 seconds' },
    { who: 'human', kind: 'img', src: 'vermeer.jpg', alt: 'Girl with a Pearl Earring', how: 'Vermeer, oil on canvas, about 1665' },
    { who: 'ai', kind: 'video', src: 'ai_horse.mp4', alt: 'A galloping horse in the style of 1870s photography', how: 'Veo, one prompt, about a minute' },
    { who: 'human', kind: 'img', src: 'monet.jpg', alt: 'Impression, Sunrise', how: 'Monet, oil on canvas, 1872' },
    { who: 'ai', kind: 'img', src: 'ai_night.jpg', alt: 'A swirling night sky over a village', how: 'Gemini, one prompt, about 10 seconds' },
    { who: 'human', kind: 'img', src: 'hiroshige.jpg', alt: 'Sudden Shower over Shin-Ohashi Bridge', how: 'Hiroshige, woodblock print, 1857' },
    { who: 'ai', kind: 'text', text: 'I wander through the city, and the city wanders through me,', how: 'Claude, asked to write like Whitman' },
    { who: 'human', kind: 'text', text: 'I celebrate myself, and sing myself, / And what I assume you shall assume,', how: 'Walt Whitman, poem, 1855' },
    { who: 'ai', kind: 'img', src: 'ai_harbor.jpg', alt: 'An impressionist harbor at sunrise', how: 'Gemini, one prompt, about 10 seconds' },
  ];
  const base = field.dataset.wall || 'assets/works/';
  const label = { img: 'Image', text: 'Poem', film: 'Video', video: 'Video' };
  const cards = [];

  works.forEach((wk, i) => {
    const el = document.createElement('div');
    el.className = `work work--${wk.who}`;
    el.style.setProperty('--w', `${8.4 + ((i * 37) % 30) / 10}rem`);
    let media;
    if (wk.kind === 'img') {
      media = new Image(); media.src = base + wk.src; media.alt = wk.alt; media.loading = 'lazy'; media.draggable = false;
    } else if (wk.kind === 'text') {
      media = document.createElement('span'); media.className = 'work__text'; media.textContent = wk.text;
    } else if (wk.kind === 'film') {
      media = document.createElement('span'); media.className = 'work__film'; media.setAttribute('role', 'img'); media.setAttribute('aria-label', wk.alt);
    } else {
      media = document.createElement('video');
      Object.assign(media, { src: base + wk.src, muted: true, loop: true, autoplay: true, playsInline: true });
      media.setAttribute('aria-label', wk.alt);
    }
    el.innerHTML = `<span class="work__inner"><span class="work__face"></span><span class="work__face work__back"><span class="work__who">${wk.who === 'ai' ? 'AI' : 'Human'}</span><span class="work__how">${wk.how}</span></span></span>`;
    const face = el.querySelector('.work__face');
    face.appendChild(media);
    const cap = document.createElement('span'); cap.className = 'work__cap'; cap.textContent = label[wk.kind];
    face.appendChild(cap);
    field.appendChild(el);
    const card = { el, timer: 0 };
    cards.push(card);

    el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') flip(card); });
    el.addEventListener('click', () => flip(card));
  });

  function flip(c) {
    c.el.classList.add('is-flipped');
    clearTimeout(c.timer);
    c.timer = setTimeout(() => c.el.classList.remove('is-flipped'), 1600);
  }

  // Scatter around the edges, leaving the centre for the title
  function scatter() {
    const W = field.clientWidth, H = field.clientHeight;
    const n = cards.length;
    cards.forEach((c, i) => {
      const a = (i / n) * Math.PI * 2 + 0.3;
      const rx = W * (0.37 + ((i * 13) % 7) / 70), ry = H * (0.35 + ((i * 7) % 5) / 50);
      const cw = c.el.offsetWidth, ch = c.el.offsetHeight;
      const x = Math.max(-cw * 0.25, Math.min(W - cw * 0.75, W / 2 + Math.cos(a) * rx - cw / 2));
      const y = Math.max(-ch * 0.2, Math.min(H - ch * 0.8, H / 2 + Math.sin(a) * ry - ch / 2));
      c.el.style.left = `${x}px`; c.el.style.top = `${y}px`;
      c.el.style.transform = `rotate(${(((i * 53) % 13) - 6)}deg)`;
    });
  }
  window.addEventListener('load', scatter);
  window.addEventListener('resize', scatter);
  scatter();
})();
