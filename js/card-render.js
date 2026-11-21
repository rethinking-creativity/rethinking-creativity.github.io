// Card front and back as HTML, from a work object (same fields as the submit form sends).
// Used by the admin page for its previews and for the 4x6 print sheet (front | back, folded to 3x4).
// QR codes are made here (qrcode-generator), pointing at work.html?k=<qr_key>.
(function () {
  const SITE = 'https://rethinking-creativity.github.io/';
  const ICON = {
    text: '<path d="M4 6h16M4 11h16M4 16h10"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle cx="16" cy="9" r="1.5"/>',
    video: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>',
    sound: '<path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 11v2"/>',
  };
  const svg = (m) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[m] || ICON.image}</svg>`;
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const label = (m) => m[0].toUpperCase() + m.slice(1);

  const workURL = (w) => `${SITE}work.html?k=${w.qr_key}`;
  // QR as an SVG data URL, so it stays sharp at print resolution
  function qr(url) {
    const q = window.qrcode(0, 'M');
    q.addData(url);
    q.make();
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }));
  }

  function front(w) {
    const who = w.credit === 'anon' ? 'Anonymous' : w.name;
    const artist = [who, w.year].filter(Boolean).join(', ');
    let content;
    const text = w.text || w.excerpt; // pasted text or a text file, else a PDF's opening lines
    if (w.medium === 'text' && text) {
      const lines = text.split('\n').filter((l) => l.trim()).slice(0, 2).join('\n');
      content = `<div class="card__excerpt"><span>${esc(lines).replace(/\n/g, '<br>')}</span><span class="more">…</span></div>`;
    } else if (w.medium === 'image' && w.src) {
      content = `<div class="card__media" style="background-image:url('${esc(w.src)}')"></div>`;
    } else if (w.medium === 'video' && w.poster) {
      content = `<div class="card__media" style="background-image:url('${esc(w.poster)}')"><span class="card__play">▶</span></div>`;
    } else if (w.medium === 'sound' && w.art) {
      content = `<div class="card__media" style="background-image:url('${esc(w.art)}')"></div>`;
    } else {
      content = `<div class="card__empty is-added">${svg(w.medium)}<span>${w.link ? 'Linked ' + w.medium : 'No picture yet'}</span></div>`;
    }
    return `<article class="card card--${w.medium}">
      <span class="card__medium">${svg(w.medium)}<span>${label(w.medium)}</span></span>
      ${content}
      <div class="card__bottom"><span><h3 class="card__title">${esc(w.title)}</h3><p class="card__artist">${esc(artist)}</p><p class="card__materials">${esc(w.materials)}</p></span>
      <span class="card__qr"><img src="${qr(workURL(w))}" alt=""></span></div>
    </article>`;
  }

  function back(w) {
    const rows = (w.process || []).map((r) => `<span class="st">${esc(r.step)}</span><span class="h">${esc(r.by_hand)}</span><span class="a">${esc(r.with_ai)}</span>`).join('');
    return `<article class="card card--back card--panels">
      ${w.description ? `<div class="card__blk"><p class="card__sec">Description</p><p class="card__about">${esc(w.description)}</p></div>` : ''}
      ${rows ? `<div class="card__blk"><p class="card__sec">Process</p><div class="card__process"><span class="hd"></span><span class="hd h"><i></i>By hand</span><span class="hd a"><i></i>With AI</span>${rows}</div></div>` : ''}
      <div class="card__brand"><span><b>Rethinking <span class="grad">Human Creativity</span> ✦<br>in the Generative AI Era</b><small>CHI 2027 Meet-Up</small></span><img src="assets/examples/qr_meetup.svg" alt=""></div>
    </article>`;
  }

  // Text front: drop words from the end of the excerpt until it fits beside the title block
  function fitExcerpt(root) {
    root.querySelectorAll('.card__excerpt').forEach((ex) => {
      const span = ex.firstElementChild;
      const cs = getComputedStyle(ex);
      const need = () => span.offsetHeight + ex.lastElementChild.offsetHeight + parseFloat(cs.rowGap) + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      let t = span.innerText;
      while (need() > ex.clientHeight + 0.5 && /\s/.test(t.trim())) {
        t = t.trim().replace(/\s+\S+$/, '');
        span.innerHTML = esc(t).replace(/\n/g, '<br>');
      }
    });
  }

  // One 6 x 4 in sheet: front | back; folding at the middle gives the 3 x 4 in card.
  // 608 x 405.33 px (cards at the mock-up size, 304 px), saved at 1800 x 1200. The layout travels with
  // the sheet, so a print never depends on which version of a page's stylesheet the browser has cached.
  const SHEET_CSS = '.sheet{width:608px;height:405.333px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:100%;background:#fdfcf8;position:relative}'
    + '.sheet__fold{position:absolute;inset:0;pointer-events:none}'
    + '.sheet__half{position:relative;min-width:0}'
    + '.sheet .card{position:relative;inset:auto;height:100%;aspect-ratio:auto;border:0;border-radius:0;box-shadow:none;transform:none}'
    + '.sheet__fold::before,.sheet__fold::after{content:"";position:absolute;left:50%;width:1px;height:5px;background:#d9d3e6}'
    + '.sheet__fold::before{top:0}.sheet__fold::after{bottom:0}';
  function sheet(w) {
    return `<div class="sheet"><style>${SHEET_CSS}</style><div class="sheet__half">${front(w)}</div><div class="sheet__half">${back(w)}</div><i class="sheet__fold" aria-hidden="true"></i></div>`;
  }

  window.CardRender = { front, back, sheet, fitExcerpt, workURL, svg, esc };
})();
