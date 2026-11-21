// Submit page: source tabs, validation, and a live preview of the printed card.
(function () {
  const form = document.getElementById('sform');
  if (!form) return;
  const MAX = 100 * 1024 * 1024;
  // Process steps the person names: the default rows, and how many rows the card can hold
  const DEFAULT_STEPS = ['Idea', 'Make', 'Refine'];
  const MAX_STEPS = 5;
  const STEP_MAX = 12;
  const CELL_MAX = 24;
  const ICON = {
    text: '<path d="M4 6h16M4 11h16M4 16h10"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle cx="16" cy="9" r="1.5"/>',
    video: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>',
    sound: '<path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 11v2"/>',
    none: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  };
  let source = 'file';
  let file = null;
  let fileURL = null;
  let tried = false;
  // What the QR page preview (work.html?preview=1) can show of a picked file: object URLs do not
  // cross tabs, so images are kept as a downscaled data URL and plain text is read in; nothing else.
  let previewFile = null;
  let previewOpen = false;
  const PREVIEW_KEY = 'rc-work-preview';
  const NEEDS_LOOK = 'A few fields need a look.';

  const byId = (id) => document.getElementById(id);
  const val = (id) => byId(id).value.trim();
  const radio = (n) => (form.querySelector(`input[name="${n}"]:checked`) || {}).value;
  const medium = () => radio('medium') || 'image';
  const noAI = () => radio('ai') === 'no';

  // Process rows: step name, By hand, With AI, and a remove control; 1 to MAX_STEPS rows
  const list = byId('stepList');
  const addBtn = byId('addStep');
  const rows = () => [...list.children];
  function addStep(name) {
    const li = document.createElement('li');
    li.className = 'steps__row';
    li.innerHTML = `<input class="steps__name" type="text" maxlength="${STEP_MAX}" data-step placeholder="Step name">`
      + `<textarea class="steps__cell steps__cell--hand" rows="2" maxlength="${CELL_MAX}" data-cell="hand"></textarea>`
      + `<textarea class="steps__cell steps__cell--ai" rows="2" maxlength="${CELL_MAX}" data-cell="ai"></textarea>`
      + '<button class="steps__del" type="button">&times;</button>';
    li.querySelector('[data-step]').value = name || '';
    const ai = li.querySelector('[data-cell="ai"]');
    ai.disabled = noAI();
    li.querySelector('.steps__del').addEventListener('click', () => removeStep(li));
    list.appendChild(li);
    syncSteps();
    return li;
  }
  function removeStep(li) {
    if (rows().length <= 1) return;
    const next = li.nextElementSibling || li.previousElementSibling;
    li.remove();
    syncSteps();
    // Keep keyboard focus in the grid rather than dropping it on the page
    next.querySelector('[data-step]').focus();
    render();
  }
  // Labels follow the row order; the add and remove controls show only where they can act
  function syncSteps() {
    const rs = rows();
    rs.forEach((li, i) => {
      const n = i + 1;
      li.querySelector('[data-step]').setAttribute('aria-label', `Step ${n} name`);
      li.querySelector('[data-cell="hand"]').setAttribute('aria-label', `Step ${n}, by hand`);
      li.querySelector('[data-cell="ai"]').setAttribute('aria-label', `Step ${n}, with AI`);
      const del = li.querySelector('.steps__del');
      del.setAttribute('aria-label', `Remove step ${n}`);
      del.hidden = rs.length <= 1;
    });
    addBtn.hidden = rs.length >= MAX_STEPS;
  }
  DEFAULT_STEPS.forEach((s) => addStep(s));
  addBtn.addEventListener('click', () => {
    if (rows().length >= MAX_STEPS) return;
    const li = addStep('');
    li.querySelector('[data-step]').focus();
    render();
  });
  // Every row, as entered (blank rows included); collect() drops the blank ones
  const stepRows = () => rows().map((li) => ({
    step: li.querySelector('[data-step]').value.trim(),
    by_hand: li.querySelector('[data-cell="hand"]').value.trim(),
    with_ai: li.querySelector('[data-cell="ai"]').value.trim(),
  }));

  // AI = no: the With AI column stays visible but empty, as on the card
  form.querySelectorAll('input[name="ai"]').forEach((r) => r.addEventListener('change', () => {
    const no = noAI();
    byId('track').classList.toggle('no-ai', no);
    list.querySelectorAll('[data-cell="ai"]').forEach((c) => { c.disabled = no; if (no) c.value = ''; });
    render();
  }));

  // Source tabs: file / link / pasted text (text medium only)
  const tabs = form.querySelectorAll('[data-src]');
  const panes = form.querySelectorAll('[data-pane]');
  function setSource(s) {
    source = s;
    tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.src === s)));
    panes.forEach((p) => { p.hidden = p.dataset.pane !== s; });
    render();
  }
  tabs.forEach((t) => t.addEventListener('click', () => setSource(t.dataset.src)));
  form.querySelectorAll('input[name="medium"]').forEach((r) => r.addEventListener('change', () => {
    const isText = r.value === 'text';
    form.querySelector('[data-src="paste"]').hidden = !isText;
    if (isText && source === 'file') setSource('paste');
    if (!isText && source === 'paste') setSource('file');
    render();
  }));

  // File pick and drag-and-drop
  const drop = form.querySelector('.drop');
  const shown = drop.querySelector('.drop__file');
  function takeFile(f) {
    if (!f) return;
    previewFile = null;
    if (fileURL) { URL.revokeObjectURL(fileURL); fileURL = null; }
    if (f.size > MAX) { file = null; shown.hidden = false; shown.textContent = `${f.name} is over 100 MB. Paste a link instead.`; shown.classList.add('is-bad'); drop.classList.remove('has-file'); render(); return; }
    file = f; shown.hidden = false; shown.classList.remove('is-bad');
    shown.textContent = `${f.name} · ${(f.size / 1048576).toFixed(1)} MB`;
    drop.classList.add('has-file');
    if (f.type.startsWith('image/')) fileURL = URL.createObjectURL(f);
    keepForPreview(f);
    render();
  }
  byId('file').addEventListener('change', (e) => takeFile(e.target.files[0]));
  ['dragenter', 'dragover'].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.remove('is-over'); }));
  drop.addEventListener('drop', (ev) => takeFile(ev.dataTransfer.files[0]));

  function collect() {
    return {
      medium: radio('medium') || null,
      source,
      link: source === 'link' ? val('link') : null,
      text: source === 'paste' ? val('pasted') : null,
      title: val('title'),
      year: val('year'),
      materials: val('materials'),
      description: val('description'),
      description_long: val('description-long'),
      used_ai: radio('ai') ? radio('ai') === 'yes' : null,
      process: stepRows().filter((r) => r.by_hand || r.with_ai), // a step name alone says nothing; drop it
      process_long: val('process-long'),
      name: val('name'),
      credit: radio('credit'),
      email: val('email'),
      consent: byId('c-own').checked && byId('c-show').checked,
      rights_owned: byId('c-own').checked,
      consent_show: byId('c-show').checked,
      consent_web: byId('c-web').checked,
      consent_future: byId('c-future').checked,
    };
  }

  // Live card preview; empty fields show a grey frame
  const card = byId('card');
  const flip = (back) => card.classList.toggle('is-flipped', back);
  card.addEventListener('click', () => flip(!card.classList.contains('is-flipped')));
  const steps = form.querySelectorAll('.sform__step');
  steps.forEach((step, i) => step.addEventListener('focusin', (e) => {
    // The longer fields appear only on the QR page, so the card stays as it is
    if (e.target.id === 'description-long' || e.target.id === 'process-long') return;
    // Step 1 shows the front, except the Description box, which is printed on the back
    flip(i === 1 || (i === 0 && e.target.id === 'description'));
  }));

  const esc = (t) => t.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  function setText(el, value, example) { el.textContent = value || example; el.classList.toggle('is-example', !value); }

  function render() {
    const d = collect();
    const chosen = radio('medium');
    const m = chosen || 'image';
    const icon = ICON[chosen || 'none'];
    const front = byId('cFront');
    front.className = `card card--${m}`;
    byId('cMedium').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg><span>${chosen ? chosen[0].toUpperCase() + chosen.slice(1) : 'Medium'}</span>`;

    // The preview starts as an empty frame; it fills in only with what the person enters
    const content = byId('cContent');
    const own = m === 'image' && fileURL && source === 'file';
    const added = (source === 'file' && file) || d.link;
    let cut = null;
    if (m === 'text' && d.text) {
      const lines = d.text.split('\n').slice(0, 2).join('\n');
      cut = lines.length > 110 ? lines.slice(0, 110) : lines;
      content.innerHTML = `<div class="card__excerpt"><span>${esc(cut).replace(/\n/g, '<br>')}</span><span class="more">…</span></div>`;
    } else if (own) content.innerHTML = `<div class="card__media" style="background-image:url('${fileURL}')"></div>`;
    else if (added) content.innerHTML = `<div class="card__empty is-added"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[m]}</svg><span>${esc(source === 'file' ? file.name : 'Linked ' + m)}</span></div>`;
    else content.innerHTML = `<div class="card__empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg><span>Your work</span></div>`;
    setText(byId('cTitle'), d.title, 'Your title');
    const who = d.credit === 'anon' ? 'Anonymous' : d.name;
    const artist = who ? (d.year ? `${who}, ${d.year}` : who) : '';
    setText(byId('cArtist'), artist, d.year ? `Your name, ${d.year}` : 'Your name, year');
    setText(byId('cMaterials'), d.materials, 'Materials');
    if (cut) fitExcerpt(cut);
    setText(byId('cDesc'), d.description, 'A sentence or two about your work.');

    const p = byId('cProcess');
    p.innerHTML = '<span class="hd"></span><span class="hd h"><i></i>By hand</span><span class="hd a"><i></i>With AI</span>';
    // The rows that will be printed; with none left, the default steps show in grey
    const shownSteps = d.process.length ? d.process : DEFAULT_STEPS.map((s) => ({ step: s, by_hand: '', with_ai: '', example: true }));
    shownSteps.forEach((r) => {
      p.insertAdjacentHTML('beforeend', `<span class="st${r.example ? ' is-example' : ''}">${esc(r.step)}</span><span class="h">${esc(r.by_hand)}</span><span class="a">${esc(r.with_ai)}</span>`);
    });

    form.querySelectorAll('[data-count]').forEach((el) => { const f = byId(el.dataset.count); el.textContent = `${f.value.length} / ${f.maxLength}`; });
    if (previewOpen) savePreview();
    // After a first submit attempt, messages clear as soon as a field is fixed
    if (tried && validate(d) && byId('status').textContent === NEEDS_LOOK) byId('status').textContent = '';
  }
  // Text front: a long title, name and materials leave less room, so drop words from the end until the excerpt fits
  function fitExcerpt(t) {
    const ex = byId('cContent').querySelector('.card__excerpt');
    if (!ex) return;
    const span = ex.firstElementChild;
    const cs = getComputedStyle(ex);
    const need = () => span.offsetHeight + ex.lastElementChild.offsetHeight + parseFloat(cs.rowGap) + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    while (need() > ex.clientHeight + 0.5 && /\s/.test(t.trim())) {
      t = t.trim().replace(/\s+\S+$/, '');
      span.innerHTML = esc(t).replace(/\n/g, '<br>');
    }
  }
  if (document.fonts) document.fonts.ready.then(() => render());
  // On phones narrower than the preview, scale the whole card (not just its box), so lines break as on the print
  const dims = document.querySelector('.preview .dims');
  function fitPreview() {
    dims.style.zoom = '';
    const k = dims.parentElement.clientWidth / dims.offsetWidth;
    if (k < 1) dims.style.zoom = String(Math.floor(k * 1000) / 1000);
  }
  window.addEventListener('resize', fitPreview);
  fitPreview();
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  render();
  if (location.hash === '#back') flip(true);

  // Example cards, as on the main page: hover flips on a mouse (CSS); a tap flips, then turns back on its own
  document.querySelectorAll('.examples .flip').forEach((f) => {
    let t = 0;
    f.querySelector('.flip__turn').addEventListener('click', (e) => { if (e.detail === 0) f.classList.toggle('is-flipped'); });
    f.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && window.flipSound) window.flipSound(); });
    f.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'mouse' || e.target.closest('a')) return;
      if (window.flipSound) window.flipSound();
      f.classList.add('is-flipped');
      clearTimeout(t);
      t = setTimeout(() => f.classList.remove('is-flipped'), 1200);
    });
  });

  // QR page preview: the current form, in the shape works-mock.js uses, handed over via localStorage
  function keepForPreview(f) {
    const mine = () => file === f;
    if (f.type.startsWith('image/')) {
      const img = new Image();
      const url = URL.createObjectURL(f);
      img.onload = () => {
        const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        if (mine()) { previewFile = { kind: 'image', src: cv.toDataURL('image/jpeg', 0.85) }; if (previewOpen) savePreview(); }
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    } else if (/^text\/|\.(txt|md)$/i.test(f.type || f.name) && f.size < 200 * 1024) {
      f.text().then((t) => { if (mine()) { previewFile = { kind: 'text', text: t }; if (previewOpen) savePreview(); } });
    }
  }
  function previewWork() {
    const d = collect();
    const m = d.medium || 'image';
    const w = { id: 'preview', medium: m, title: d.title, year: d.year, materials: d.materials, credit: d.credit, name: d.name,
      description: d.description, description_long: d.description_long, process: d.process, process_long: d.process_long };
    if (source === 'paste') w.text = d.text;
    else if (source === 'link') w.link = d.link;
    else if (file && previewFile && previewFile.kind === 'text' && m === 'text') w.text = previewFile.text;
    else if (file && previewFile && previewFile.kind === 'image' && m === 'image') w.src = previewFile.src;
    else if (file) w.pending = file.name;
    return w;
  }
  function savePreview() {
    const w = previewWork();
    try { localStorage.setItem(PREVIEW_KEY, JSON.stringify(w)); } catch (e) {
      // Over the storage quota: keep the words, drop the picture
      delete w.src; w.pending = file ? file.name : '';
      try { localStorage.setItem(PREVIEW_KEY, JSON.stringify(w)); } catch (e2) { /* storage unavailable */ }
    }
  }
  byId('qrPreview').addEventListener('click', () => { previewOpen = true; savePreview(); });

  // Validation and submit
  // Each message is tied to its controls: described by it and marked invalid while it shows
  const CONTROLS = {
    medium: () => form.querySelectorAll('input[name="medium"]'),
    source: () => [byId({ file: 'file', link: 'link', paste: 'pasted' }[source])],
    title: () => [byId('title')],
    ai: () => form.querySelectorAll('input[name="ai"]'),
    name: () => [byId('name')],
    email: () => [byId('email')],
    consent: () => [byId('c-own'), byId('c-show')].filter((c) => !c.checked),
  };
  const ALL_CONTROLS = { ...CONTROLS, source: () => [byId('file'), byId('link'), byId('pasted')], consent: () => [byId('c-own'), byId('c-show')] };
  function err(k, on) {
    const msg = form.querySelector(`[data-err="${k}"]`);
    msg.id = msg.id || `err-${k}`;
    msg.classList.toggle('is-on', on);
    ALL_CONTROLS[k]().forEach((c) => { c.removeAttribute('aria-invalid'); c.removeAttribute('aria-describedby'); });
    if (on) CONTROLS[k]().forEach((c) => { c.setAttribute('aria-invalid', 'true'); c.setAttribute('aria-describedby', msg.id); });
    return on;
  }
  function validate(d) {
    let bad = false;
    bad = err('medium', !d.medium) || bad;
    const hasSource = (source === 'file' && file) || (source === 'link' && /^https?:\/\/\S+/.test(d.link || '')) || (source === 'paste' && d.text);
    bad = err('source', !hasSource) || bad;
    bad = err('title', !d.title) || bad;
    bad = err('ai', d.used_ai === null) || bad;
    bad = err('name', !d.name) || bad;
    bad = err('email', !/^\S+@\S+\.\S+$/.test(d.email)) || bad;
    bad = err('consent', !d.consent) || bad;
    return !bad;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = byId('status');
    const d = collect();
    tried = true;
    if (!validate(d)) {
      status.textContent = NEEDS_LOOK;
      // Move focus (not just the view) to the first field that needs a look
      const first = form.querySelector('[aria-invalid="true"]');
      if (first) { first.focus({ preventScroll: true }); first.closest('.field, fieldset').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; status.textContent = 'Sending…';
    const res = await window.SubmitAPI.submit(d, source === 'file' ? file : null, {
      onProgress: (f) => { status.textContent = `Uploading… ${Math.round(f * 100)}%`; },
    });
    btn.disabled = false;
    if (!res.ok) { status.textContent = 'Something went wrong. Please try again, or email us.'; return; }
    status.textContent = '';
    try { localStorage.removeItem(PREVIEW_KEY); } catch (_) { /* storage unavailable */ }
    form.hidden = true;
    document.querySelector('.submit__head').hidden = true;
    byId('done').hidden = false;
    document.dispatchEvent(new CustomEvent('rc:submitted', { detail: { id: res.id } })); // on-site printing (onsite.js)
    window.scrollTo({ top: 0 });
    byId('done').focus({ preventScroll: true });
  });
})();
