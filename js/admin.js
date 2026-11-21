// Organizer page: every submission is live at once (no approval step). Here organizers print cards
// (SELPHY, 4 x 6 in, front | back), see what is printed and what each person allowed,
// and withdraw a work on request (consent: Withdrawal).
// Data comes from AdminAPI (js/admin-api.js, the meetup-admin Edge Function).
(function () {
  const KEY = 'rc-admin-key';
  const SHEET_W = 608; // CSS px of the 6 in sheet (card.css mock-up size); saved at 1800 px wide
  const byId = (id) => document.getElementById(id);
  const { esc, svg } = window.CardRender;
  const TABS = [['unprinted', 'Not printed'], ['printed', 'Printed'], ['withdrawn', 'Withdrawn'], ['all', 'All']];
  const live = (w) => w.status !== 'withdrawn';
  const IN_TAB = {
    unprinted: (w) => live(w) && !w.printed_at,
    printed: (w) => live(w) && !!w.printed_at,
    withdrawn: (w) => !live(w),
    all: () => true,
  };
  // What the person allowed, beyond the required in-person showing
  const permission = (w) => (w.consent_web && w.consent_future ? 'Website + future use'
    : w.consent_web ? 'Website' : w.consent_future ? 'Future use' : 'In person only');

  let works = [];
  let tab = 'unprinted';
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

  const shown = () => works.filter(IN_TAB[tab]).sort((a, b) => a.created_at < b.created_at ? -1 : 1);
  const byKey = (id) => works.find((w) => w.id === id);
  const thumb = (w) => w.src && w.medium === 'image' ? w.src : w.poster || w.art || '';
  const when = (iso) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  function draw() {
    byId('tabs').innerHTML = TABS.map(([k, l]) => {
      const n = works.filter(IN_TAB[k]).length;
      return `<button type="button" data-tab="${k}" aria-pressed="${k === tab}">${l}<b>${n}</b></button>`;
    }).join('');
    byId('zip').hidden = tab !== 'unprinted' || !shown().filter((w) => w.file_ok).length;

    const list = shown();
    if (current && !list.some((w) => w.id === current)) current = null;
    if (!current && list.length) current = list[0].id;
    byId('list').innerHTML = list.length ? list.map((w) => {
      const t = thumb(w);
      const tags = [
        !w.file_ok && '<span class="ad-tag ad-tag--bad">Upload incomplete</span>',
        `<span class="ad-tag${w.consent_web || w.consent_future ? ' ad-tag--ok' : ''}">${permission(w)}</span>`,
        w.attending === 'no' && '<span class="ad-tag">Not attending</span>',
        w.attending === 'unsure' && '<span class="ad-tag">Maybe attending</span>',
        tab === 'all' && (live(w) ? (w.printed_at ? '<span class="ad-tag">Printed</span>' : '') : '<span class="ad-tag ad-tag--bad">Withdrawn</span>'),
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
    const can = live(w) && w.file_ok;
    const status = live(w)
      ? '<button class="ad-btn ad-btn--warn" type="button" data-act="withdraw">Withdraw</button>'
      : '<button class="ad-btn" type="button" data-act="restore">Restore</button>';
    const del = !live(w) || !w.file_ok ? '<button class="ad-btn ad-btn--warn" type="button" data-act="delete">Delete</button>' : '';
    const file = w.link ? `<a href="${esc(w.link)}" target="_blank" rel="noopener">${esc(w.link)}</a>`
      : w.src || w.pdf ? `<a href="${esc(w.src || w.pdf)}" target="_blank" rel="noopener">Open file</a>`
        : w.text ? 'Pasted text' : '—';
    box.innerHTML = `
      <h2>${esc(w.title)}</h2>
      ${w.file_ok ? '' : '<p class="ad-note">The file never finished uploading, so there is nothing to show or print. Delete this entry.</p>'}
      ${live(w) ? '' : '<p class="ad-note">Withdrawn: its QR page is closed and it is left out of printing.</p>'}
      <div class="ad-sheetbox" id="sheetbox">${window.CardRender.sheet(w)}</div>
      <div class="ad-actions">
        <button class="ad-btn ad-btn--main" type="button" data-act="print"${can ? '' : ' disabled'}>Print card <kbd>p</kbd></button>
        <button class="ad-btn" type="button" data-act="png"${can ? '' : ' disabled'}>Download print sheet</button>
        <button class="ad-btn" type="button" data-act="printed"${live(w) ? '' : ' disabled'}>${w.printed_at ? 'Mark not printed' : 'Mark printed'}</button>
        <button class="ad-btn" type="button" data-act="copy">Copy QR link</button>
      </div>
      <div class="ad-actions">${status}${del}</div>
      <dl class="ad-fields">
        <dt>Name</dt><dd>${esc(w.name)}</dd>
        <dt>Credit</dt><dd>${w.credit === 'anon' ? 'Anonymous' : 'Name'}</dd>
        <dt>Keep posted</dt><dd>${w.keep_posted ? 'Yes' : 'No'}</dd>
        <dt>At CHI in person</dt><dd>${({ yes: 'Yes', unsure: 'Not sure yet', no: 'No' })[w.attending] || '—'}</dd>
        <dt>Email</dt><dd><a href="mailto:${esc(w.email)}">${esc(w.email)}</a></dd>
        <dt>Submitted</dt><dd>${when(w.created_at)}</dd>
        <dt>Work</dt><dd>${file}</dd>
        <dt>Printed</dt><dd>${w.printed_at ? when(w.printed_at) : 'No'}</dd>
        <dt>Permission</dt><dd>In person${w.consent_web ? ' · website after the meet-up' : ''}${w.consent_future ? ' · future events and publications' : ''}</dd>
        <dt>Used AI</dt><dd>${w.used_ai ? 'Yes' : 'No'}</dd>
        ${w.description_long ? `<dt>Full description</dt><dd>${esc(w.description_long)}</dd>` : ''}
        ${w.process_long ? `<dt>About the process</dt><dd>${esc(w.process_long)}</dd>` : ''}
        ${w.tool_wish ? `<dt>For future tools</dt><dd>${esc(w.tool_wish)}</dd>` : ''}
        <dt>QR key</dt><dd>${esc(w.qr_key)}</dd>
      </dl>
      <p class="ad-keys">Keys: j / k next and previous · p print</p>`;
    const sb = byId('sheetbox');
    const sheet = sb.firstElementChild;
    const fit = () => { sheet.style.transform = `scale(${sb.clientWidth / SHEET_W})`; };
    fit();
    window.CardRender.fitExcerpt(sb);
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
    if (a === 'withdraw') { if (!confirm(`Withdraw “${w.title}”? Its QR page closes; you can restore it later.`)) return; await api.setStatus(w.id, 'withdrawn'); }
    else if (a === 'restore') await api.setStatus(w.id, 'active');
    else if (a === 'printed') await api.setPrinted(w.id, !w.printed_at);
    else if (a === 'delete') { if (!confirm(`Delete “${w.title}” and its file? This cannot be undone.`)) return; await api.remove(w.id); }
    else if (a === 'copy') { await navigator.clipboard.writeText(window.CardRender.workURL(w)); toast('QR link copied'); return; }
    else if (a === 'png') { download(await window.PrintSheet.png(w), fileName(w)); return; }
    else if (a === 'print') {
      if (!live(w) || !w.file_ok) return;
      await window.PrintSheet.print(w);
      if (!w.printed_at) await api.setPrinted(w.id, true); // undo with "Mark not printed"
    }
    else return;
    // A work that leaves this tab (printed, withdrawn, deleted): move on to the next one
    const list = shown();
    const i = list.findIndex((x) => x.id === w.id);
    works = await api.list();
    if (!shown().some((x) => x.id === w.id)) { const next = list[i + 1] || list[i - 1]; current = next ? next.id : null; }
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
    let list = shown().filter((w) => w.file_ok);
    const missing = list.filter(needsCover);
    for (let i = 0; i < missing.length; i++) {
      btn.textContent = `Making pictures… ${i + 1} / ${missing.length}`;
      await makeCover(missing[i]);
    }
    if (missing.length) { works = await window.AdminAPI.list(); list = shown().filter((w) => w.file_ok); }
    for (let i = 0; i < list.length; i++) {
      btn.textContent = `Making sheets… ${i + 1} / ${list.length}`;
      files[fileName(list[i])] = new Uint8Array(await (await window.PrintSheet.png(list[i])).arrayBuffer());
    }
    const zip = window.fflate.zipSync(files, { level: 0 }); // PNGs are already compressed
    download(new Blob([zip], { type: 'application/zip' }), `print-sheets-${new Date().toISOString().slice(0, 10)}.zip`);
    btn.textContent = 'Download print sheets (.zip)';
    btn.disabled = false;
    if (confirm(`Mark these ${list.length} works as printed?`)) {
      for (const w of list) await window.AdminAPI.setPrinted(w.id, true);
      works = await window.AdminAPI.list();
      draw();
    }
  });

  // Mailing list: emails of everyone who asked to be kept posted
  byId('mailing').addEventListener('click', async () => {
    const emails = [...new Set(works.filter((w) => w.keep_posted).map((w) => w.email))];
    if (!emails.length) { toast('No one has asked to be kept posted yet'); return; }
    await navigator.clipboard.writeText(emails.join(', '));
    toast(`${emails.length} email${emails.length > 1 ? 's' : ''} copied`);
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
    else if (e.key === 'p') act('print');
  });

  start();
})();
