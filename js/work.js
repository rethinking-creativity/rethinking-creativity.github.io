// QR page: one work in full. work.html?k=<qr_key> loads a submitted work (js/works-api.js),
// work.html?id=<id> one of the sample works (js/works-mock.js);
(function () {
  const root = document.getElementById('work');
  const ICON = {
    text: '<path d="M4 6h16M4 11h16M4 16h10"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle cx="16" cy="9" r="1.5"/>',
    video: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>',
    sound: '<path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 11v2"/>',
  };
  const svg = (m) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[m] || ICON.image}</svg>`;
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const para = (t) => esc(t).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  const safeURL = (u) => (/^(https?:|data:image\/|assets\/)/i.test(u || '') ? u : '');

  // The questions on the submit form (Your take), as the person answered them
  const TAKE = [
    ['q1', 'Can creativity be shared between you and AI?'],
    ['q2', 'Which parts of creating do you want to keep for yourself?'],
    ['q3', 'What does growing as a creator mean to you when more of the creative process can be handed to AI?'],
    ['q4', 'How do you know whether a tool supports your creativity?'],
    ['q5', 'What should future creativity tools do, or never do?'],
  ];

  function media(w) {
    const m = w.medium;
    if (w.link) {
      const u = safeURL(w.link);
      return `<div class="wk-hold">${svg(m)}${u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(w.link)}</a>` : `<span>${esc(w.link)}</span>`}</div>`;
    }
    // A PDF (text works only): shown in the page where the browser can, always with a link
    if (w.pdf) {
      const u = safeURL(w.pdf);
      return `<div class="wk-pdf"><object data="${esc(u)}" type="application/pdf" aria-label="${esc(w.title)}"></object><a href="${esc(u)}" target="_blank" rel="noopener">${svg('text')}Open PDF</a></div>`;
    }
    // Full text: one line per line, so a wrapped line hangs instead of looking like a new one
    if (m === 'text' && w.text) return `<div class="wk-text">${esc(w.text).split(/\n{2,}/).map((st) => `<p>${st.split('\n').map((l) => `<span>${l}</span>`).join('')}</p>`).join('')}</div>`;
    const src = safeURL(w.src);
    if (m === 'image' && src) return `<button class="wk-img" type="button" aria-label="View full resolution"><img src="${esc(src)}" alt="${esc(w.title)}"></button>`;
    if (m === 'video' && src) return `<video class="wk-video" controls playsinline preload="metadata"${w.poster ? ` poster="${esc(safeURL(w.poster))}"` : ''} src="${esc(src)}"></video>`;
    if (m === 'sound' && src) return `<div class="wk-sound">${w.art ? `<img src="${esc(safeURL(w.art))}" alt="">` : ''}<audio controls preload="metadata" src="${esc(src)}"></audio></div>`;
    // No picture to show (e.g. a file that did not finish uploading): a neutral frame
    return `<div class="wk-hold">${svg(m)}</div>`;
  }

  function show(w) {
    const who = w.credit === 'anon' ? 'Anonymous' : w.name;
    const artist = [who, w.year].filter(Boolean).join(', ');
    const label = w.medium[0].toUpperCase() + w.medium.slice(1);
    document.title = `${w.title || label} · Rethinking Human Creativity`;
    // Process: the steps the person named, each with a By hand and a With AI cell
    const steps = (w.process || []).filter((r) => r && (r.step || r.by_hand || r.with_ai));
    const hasCells = steps.some((r) => r.by_hand || r.with_ai);
    const cells = steps.map((r) => `<span class="st">${esc(r.step)}</span><span class="h">${esc(r.by_hand)}</span><span class="a">${esc(r.with_ai)}</span>`).join('');
    root.innerHTML = `
      <div class="wk__work">
        <p class="wk__medium">${svg(w.medium)}<span>${label}</span></p>
        ${media(w)}
      </div>
      <div class="wk__info">
        <h1 class="wk__title">${esc(w.title)}</h1>
        <div class="wk__byline">
          ${artist ? `<p class="wk__artist">${esc(artist)}</p>` : ''}
          ${w.materials ? `<p class="wk__materials">${esc(w.materials)}</p>` : ''}
        </div>
        ${w.description || w.description_long ? `<section class="wk__blk" aria-labelledby="h-desc">
          <h2 id="h-desc">Description</h2>
          ${w.description ? para(w.description) : ''}
          ${w.description_long ? para(w.description_long) : ''}
        </section>` : ''}
        ${hasCells || w.process_long ? `<section class="wk__blk" aria-labelledby="h-process">
          <h2 id="h-process">Process</h2>
          ${hasCells ? `<div class="wk__process"><span class="hd"></span><span class="hd h"><i></i>By hand</span><span class="hd a"><i></i>With AI</span>${cells}</div>` : ''}
          ${w.process_long ? `${hasCells ? '<h3>More about the process</h3>' : ''}${para(w.process_long)}` : ''}
        </section>` : ''}
        ${Object.keys(w.answers || {}).length ? `<section class="wk__blk" aria-labelledby="h-take">
          <h2 id="h-take">The artist's take</h2>
          ${TAKE.filter(([k]) => w.answers[k]).map(([k, q]) => `<h3 class="wk__q">${q}</h3>${para(w.answers[k])}`).join('')}
        </section>` : ''}
        ${w.practice || w.background ? `<section class="wk__blk" aria-labelledby="h-artist">
          <h2 id="h-artist">About the artist</h2>
          <dl class="wk__kv">${w.practice ? `<dt>Makes</dt><dd>${esc(w.practice)}</dd>` : ''}${w.background ? `<dt>Background</dt><dd>${esc(w.background)}</dd>` : ''}</dl>
        </section>` : ''}
      </div>`;
    const btn = root.querySelector('.wk-img');
    if (btn) btn.addEventListener('click', () => zoom(btn.querySelector('img').src, w.title));
  }

  function notFound() {
    document.title = 'Work not found · Rethinking Human Creativity';
    root.innerHTML = '<div class="wk-none"><h1>Work not found</h1><p><a href="./">Go to the meet-up page</a></p></div>';
  }

  // After the meet-up, works without web consent are no longer shown
  function closed() {
    document.title = 'Rethinking Human Creativity';
    root.innerHTML = '<div class="wk-none"><p>This work was shown at the CHI 2027 Meet-Up and is no longer online.</p><p><a href="./">Go to the meet-up page</a></p></div>';
  }

  // Full-resolution view: fits the screen first; a tap shows the image at its own size, scrollable
  const dlg = document.getElementById('zoom');
  const dimg = dlg.querySelector('img');
  function zoom(src, title) {
    dimg.src = src; dimg.alt = title || '';
    dlg.classList.remove('is-full');
    dlg.showModal();
  }
  dimg.addEventListener('click', () => dlg.classList.toggle('is-full'));
  dlg.querySelector('.wk-zoom__close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.classList.contains('wk-zoom__frame')) dlg.close(); });

  const q = new URLSearchParams(location.search);
  const k = q.get('k');
  (k ? window.WorksAPI.byKey(k) : window.WorksAPI.get(q.get('id')))
    .then((w) => (w && w.closed ? closed() : w ? show(w) : notFound()), notFound);
})();
