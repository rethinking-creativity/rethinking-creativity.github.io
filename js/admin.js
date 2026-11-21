// Organizer page: sign in, review submissions, approve / reject, pair two approved works,
// and save print sheets (4 x 6 in PNG, 1800 x 1200, front | back) for the Canon SELPHY.
// Data comes from AdminAPI (js/admin-api.js, the meetup-admin Edge Function).
(function () {
  const KEY = 'rc-admin-key';
  const SHEET_W = 608; // CSS px of the 6 in sheet (card.css mock-up size); saved at 1800 px wide
  const byId = (id) => document.getElementById(id);
  const { esc, svg } = window.CardRender;
  const TABS = [['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['all', 'All']];

  let works = [];
  let tab = 'pending';
  let current = null;

  // Sign in: the password stays in this tab only (sessionStorage)
  async function start() {
    const saved = sessionStorage.getItem(KEY);
    if (saved && await window.AdminAPI.signIn(saved)) return open();
    byId('login').hidden = false;
    byId('key').focus();
  }
  byId('login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const k = byId('key').value;
    if (!(await window.AdminAPI.signIn(k))) { byId('loginErr').textContent = 'That password did not work.'; return; }
    sessionStorage.setItem(KEY, k);
    byId('login').hidden = true;
    open();
  });
  byId('signOut').addEventListener('click', () => { sessionStorage.removeItem(KEY); location.reload(); });

  async function open() {
    byId('app').hidden = false;
    works = await window.AdminAPI.list();
    draw();
  }

  const shown = () => works.filter((w) => tab === 'all' || w.status === tab).sort((a, b) => a.created_at < b.created_at ? -1 : 1);
  const byKey = (id) => works.find((w) => w.id === id);
  const thumb = (w) => w.src && w.medium === 'image' ? w.src : w.poster || w.art || '';
  const when = (iso) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  function draw() {
    byId('tabs').innerHTML = TABS.map(([k, l]) => {
      const n = k === 'all' ? works.length : works.filter((w) => w.status === k).length;
      return `<button type="button" data-tab="${k}" aria-pressed="${k === tab}">${l}<b>${n}</b></button>`;
    }).join('');
    byId('zip').hidden = tab !== 'approved' || !shown().length;

    const list = shown();
    if (current && !list.some((w) => w.id === current)) current = null;
    if (!current && list.length) current = list[0].id;
    byId('list').innerHTML = list.length ? list.map((w) => {
      const t = thumb(w);
      const pair = w.pair_id && byKey(w.pair_id);
      const tags = [
        !w.file_ok && '<span class="ad-tag ad-tag--bad">Upload incomplete</span>',
        pair && `<span class="ad-tag ad-tag--pair">↔ ${esc(pair.title)}</span>`,
        w.consent_web && '<span class="ad-tag ad-tag--ok">Web</span>',
        w.consent_future && '<span class="ad-tag ad-tag--ok">Future</span>',
        tab === 'all' && `<span class="ad-tag">${w.status}</span>`,
      ].filter(Boolean).join('');
      return `<li><button class="ad-row" type="button" data-id="${w.id}" aria-current="${w.id === current}">
        <span class="ad-thumb"${t ? ` style="background-image:url('${esc(t)}')"` : ''}>${t ? '' : svg(w.medium)}</span>
        <span><span class="ad-row__t">${esc(w.title)}</span><span class="ad-row__s">${esc(w.name)}${w.credit === 'anon' ? ' (shown as Anonymous)' : ''} · ${w.medium} · ${when(w.created_at)}</span></span>
        <span class="ad-tags">${tags}</span></button></li>`;
    }).join('') : '<li class="ad-empty">Nothing here.</li>';
    detail();
  }

  function detail() {
    const box = byId('detail');
    const w = current && byKey(current);
    if (!w) { box.innerHTML = ''; return; }
    const others = works.filter((o) => o.status === 'approved' && o.id !== w.id);
    const pairUI = w.status !== 'approved' ? ''
      : `<select id="pairSel" aria-label="Pair with"><option value="">${w.pair_id ? 'Change pair…' : 'Pair with…'}</option>${others.map((o) => `<option value="${o.id}">${esc(o.title)}${o.pair_id && o.pair_id !== w.id ? ' (paired)' : ''}</option>`).join('')}</select>`
        + (w.pair_id ? '<button class="ad-btn" type="button" data-act="unpair">Unpair</button>' : '');
    const status = {
      pending: `<button class="ad-btn ad-btn--main" type="button" data-act="approve"${w.file_ok ? '' : ' disabled'}>Approve <kbd>a</kbd></button><button class="ad-btn" type="button" data-act="reject">Reject <kbd>r</kbd></button>`,
      approved: '<button class="ad-btn" type="button" data-act="pending">Back to pending</button><button class="ad-btn" type="button" data-act="reject">Reject</button>',
      rejected: `<button class="ad-btn" type="button" data-act="approve"${w.file_ok ? '' : ' disabled'}>Approve</button>`,
      withdrawn: '',
    }[w.status];
    const del = w.status === 'rejected' || !w.file_ok ? '<button class="ad-btn ad-btn--warn" type="button" data-act="delete">Delete</button>' : '';
    const file = w.link ? `<a href="${esc(w.link)}" target="_blank" rel="noopener">${esc(w.link)}</a>`
      : w.src || w.pdf ? `<a href="${esc(w.src || w.pdf)}" target="_blank" rel="noopener">Open file</a>`
        : w.text ? 'Pasted text' : '—';
    const pair = w.pair_id && byKey(w.pair_id);
    box.innerHTML = `
      <h2>${esc(w.title)}</h2>
      ${w.file_ok ? '' : '<p class="ad-note">The file never finished uploading. This entry cannot be approved; delete it.</p>'}
      <div class="ad-sheetbox" id="sheetbox">${window.CardRender.sheet(w)}</div>
      <div class="ad-actions">${status}${del}</div>
      <div class="ad-actions">
        <button class="ad-btn" type="button" data-act="print"${w.status === 'approved' ? '' : ' disabled'}>Print card</button>
        <button class="ad-btn" type="button" data-act="png"${w.status === 'approved' ? '' : ' disabled'}>Download print sheet</button>
        <button class="ad-btn" type="button" data-act="copy">Copy QR link</button>
        ${pairUI}
      </div>
      <dl class="ad-fields">
        <dt>Name</dt><dd>${esc(w.name)}${w.credit === 'anon' ? ' — printed as “Anonymous”' : ''}</dd>
        <dt>Email</dt><dd><a href="mailto:${esc(w.email)}">${esc(w.email)}</a></dd>
        <dt>Submitted</dt><dd>${when(w.created_at)}</dd>
        <dt>Work</dt><dd>${file}</dd>
        <dt>Pair</dt><dd>${pair ? esc(pair.title) : '—'}</dd>
        <dt>Web after meet-up</dt><dd>${w.consent_web ? 'Yes' : 'No'}</dd>
        <dt>Future use</dt><dd>${w.consent_future ? 'Yes' : 'No'}</dd>
        <dt>Used AI</dt><dd>${w.used_ai ? 'Yes' : 'No'}</dd>
        ${w.description_long ? `<dt>Full description</dt><dd>${esc(w.description_long)}</dd>` : ''}
        ${w.process_long ? `<dt>About the process</dt><dd>${esc(w.process_long)}</dd>` : ''}
        <dt>QR key</dt><dd>${esc(w.qr_key)}</dd>
      </dl>
      <p class="ad-keys">Keys: j / k next and previous · a approve · r reject</p>`;
    const sb = byId('sheetbox');
    const sheet = sb.firstElementChild;
    const fit = () => { sheet.style.transform = `scale(${sb.clientWidth / SHEET_W})`; };
    fit();
    window.CardRender.fitExcerpt(sb);
    const sel = byId('pairSel');
    if (sel) sel.addEventListener('change', () => sel.value && act('pair', sel.value));
    if (needsCover(w)) makeCover(w).then((made) => { if (made) refresh(); });
  }

  // Card-front picture for video, sound and linked works, made once and stored with the work
  const tried = new Set();
  const needsCover = (w) => !tried.has(w.id) && window.PrintSheet.needsCover(w);
  async function makeCover(w) {
    tried.add(w.id);
    try { return await window.AdminAPI.makeCover(w); } catch (e) { console.error(e); return false; }
  }
  async function refresh() { works = await window.AdminAPI.list(); draw(); }
  window.addEventListener('resize', () => { const sb = byId('sheetbox'); if (sb) sb.firstElementChild.style.transform = `scale(${sb.clientWidth / SHEET_W})`; });

  function toast(t) {
    const el = byId('toast');
    el.textContent = t;
    el.classList.add('is-on');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('is-on'), 1800);
  }

  async function act(a, arg) {
    try { await doAct(a, arg); } catch (e) { console.error(e); toast('That did not work. Try again.'); }
  }
  async function doAct(a, arg) {
    const w = byKey(current);
    if (!w) return;
    const api = window.AdminAPI;
    if (a === 'approve' && w.file_ok) await api.setStatus(w.id, 'approved');
    else if (a === 'reject') await api.setStatus(w.id, 'rejected');
    else if (a === 'pending') await api.setStatus(w.id, 'pending');
    else if (a === 'pair') await api.pair(w.id, arg);
    else if (a === 'unpair') await api.unpair(w.id);
    else if (a === 'delete') { if (!confirm(`Delete “${w.title}” and its file? This cannot be undone.`)) return; await api.remove(w.id); }
    else if (a === 'copy') { await navigator.clipboard.writeText(window.CardRender.workURL(w)); toast('QR link copied'); return; }
    else if (a === 'png') { download(await window.PrintSheet.png(w), fileName(w)); return; }
    else if (a === 'print') { await window.PrintSheet.print(w); return; }
    else return;
    // Moving on after a decision keeps the review going
    const list = shown();
    const i = list.findIndex((x) => x.id === w.id);
    works = await api.list();
    if (['approve', 'reject', 'delete'].includes(a)) { const next = list[i + 1] || list[i - 1]; current = next ? next.id : null; }
    draw();
  }

  const slug = (t) => (t || 'work').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const fileName = (w) => `${slug(w.title)}-${w.qr_key}.png`;
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  byId('zip').addEventListener('click', async () => {
    const btn = byId('zip');
    btn.disabled = true;
    const files = {};
    let list = shown();
    const missing = list.filter(needsCover);
    for (let i = 0; i < missing.length; i++) {
      btn.textContent = `Making pictures… ${i + 1} / ${missing.length}`;
      await makeCover(missing[i]);
    }
    if (missing.length) { works = await window.AdminAPI.list(); list = shown(); }
    for (let i = 0; i < list.length; i++) {
      btn.textContent = `Making sheets… ${i + 1} / ${list.length}`;
      files[fileName(list[i])] = new Uint8Array(await (await window.PrintSheet.png(list[i])).arrayBuffer());
    }
    const zip = window.fflate.zipSync(files, { level: 0 }); // PNGs are already compressed
    download(new Blob([zip], { type: 'application/zip' }), `print-sheets-${new Date().toISOString().slice(0, 10)}.zip`);
    btn.textContent = 'Download print sheets (.zip)';
    btn.disabled = false;
  });

  byId('tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; current = null; draw(); } });
  byId('list').addEventListener('click', (e) => { const b = e.target.closest('[data-id]'); if (b) { current = b.dataset.id; draw(); } });
  byId('detail').addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b && !b.disabled) act(b.dataset.act); });
  document.addEventListener('keydown', (e) => {
    if (byId('app').hidden || e.metaKey || e.ctrlKey || e.altKey || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
    const list = shown();
    const i = list.findIndex((w) => w.id === current);
    if (e.key === 'j' && list[i + 1]) { current = list[i + 1].id; draw(); }
    else if (e.key === 'k' && list[i - 1]) { current = list[i - 1].id; draw(); }
    else if (e.key === 'a') act('approve');
    else if (e.key === 'r') act('reject');
  });

  start();
})();
