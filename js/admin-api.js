// Organizer backend: the meetup-admin Edge Function. The password goes in x-admin-key on every call.
// admin.js calls AdminAPI.{signIn, list, setStatus, pair, unpair, remove, makeCover}.
(function () {
  const PROJECT = 'rojnzjoznpkcqfgweohk';
  const FN = `https://${PROJECT}.supabase.co/functions/v1/meetup-admin`;
  const STORAGE = `https://${PROJECT}.supabase.co/storage/v1`;
  const PUBLISHABLE_KEY = 'sb_publishable_xhLGR-vUiEERd5hWaparrA_n1HSyJYn'; // public by design
  let key = '';

  async function call(action, body = {}) {
    const res = await fetch(FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: PUBLISHABLE_KEY, 'x-admin-key': key },
      body: JSON.stringify({ action, ...body }),
    });
    const out = await res.json().catch(() => ({ ok: false }));
    if (!out.ok && action !== 'signin' && action !== 'link_cover') throw new Error(out.error || `meetup-admin ${res.status}`);
    return out;
  }

  // Covers: video frame and sound waveform are made here from the file; a link's thumbnail is fetched by the server
  async function makeCover(w) {
    if (w.link) return (await call('link_cover', { id: w.id })).ok;
    let blob, ext;
    if (w.medium === 'video' && w.src) { blob = await window.Covers.videoFrame(w.src); ext = 'jpg'; }
    else if (w.medium === 'sound' && w.src) { blob = await window.Covers.waveform(w.src); ext = 'svg'; }
    else return false;
    const up = await call('cover_upload', { id: w.id, ext });
    const res = await fetch(`${STORAGE}/object/upload/sign/meetup-works/${up.path}?token=${encodeURIComponent(up.token)}`, {
      method: 'PUT',
      headers: { apikey: PUBLISHABLE_KEY, 'content-type': blob.type, 'x-upsert': 'true' },
      body: blob,
    });
    if (!res.ok) throw new Error(`cover upload ${res.status}`);
    await call('cover_set', { id: w.id, path: up.path });
    return true;
  }

  window.AdminAPI = {
    async signIn(k) { key = k; return (await call('signin')).ok; },
    async list() { return (await call('list')).works; },
    setStatus: (id, status) => call('status', { id, status }),
    pair: (id, other) => call('pair', { id, other }),
    unpair: (id) => call('unpair', { id }),
    remove: (id) => call('delete', { id }),
    makeCover,
  };
})();
