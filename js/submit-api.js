// Submission backend: the meetup-submit Edge Function (Supabase project "personal").
// submit.js calls SubmitAPI.submit(payload, file, { onProgress }) and gets { ok, id } or { ok: false, error }.
// Flow: Turnstile token -> meetup-submit saves the row and, for a file, returns a signed upload token
// -> the file goes to the private meetup-works bucket as a resumable (TUS) upload, so a dropped
// connection on a large video picks up where it stopped.
(function () {
  const PROJECT = 'rojnzjoznpkcqfgweohk';
  const FUNCTIONS = `https://${PROJECT}.supabase.co/functions/v1`;
  const TUS_ENDPOINT = `https://${PROJECT}.storage.supabase.co/storage/v1/upload/resumable/sign`; // signed-token TUS route
  const PUBLISHABLE_KEY = 'sb_publishable_xhLGR-vUiEERd5hWaparrA_n1HSyJYn'; // public by design
  const TURNSTILE_SITE_KEY = '0x4AAAAAAGLLI3rIt_ijOOKQ'; // public by design; the secret lives only in Supabase

  // Turnstile: rendered once, invisible unless Cloudflare wants an interaction; a token is single-use
  let widget = null;
  let token = '';
  let waiting = [];
  const settle = (t) => { token = t; waiting.forEach((w) => w(t)); waiting = []; };
  window.rcTurnstileLoad = () => {
    widget = window.turnstile.render('#turnstile', {
      sitekey: TURNSTILE_SITE_KEY,
      appearance: 'interaction-only',
      callback: settle,
      'expired-callback': () => { token = ''; },
      'error-callback': () => { token = ''; },
    });
  };
  const s = document.createElement('script');
  s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=rcTurnstileLoad&render=explicit';
  s.async = true;
  document.head.appendChild(s);

  function getToken(ms = 60000) {
    if (token) return Promise.resolve(token);
    return new Promise((resolve) => {
      const t = setTimeout(() => resolve(''), ms);
      waiting.push((v) => { clearTimeout(t); resolve(v); });
    });
  }
  function useToken() {
    token = '';
    if (widget !== null) window.turnstile.reset(widget);
  }

  // Some browsers leave the type of .md / .txt files empty
  const typeOf = (f) => f.type || (/\.md$/i.test(f.name) ? 'text/markdown' : /\.txt$/i.test(f.name) ? 'text/plain' : '');

  function upload(file, up, onProgress) {
    return new Promise((resolve, reject) => {
      const u = new window.tus.Upload(file, {
        endpoint: TUS_ENDPOINT,
        headers: { apikey: PUBLISHABLE_KEY, 'x-signature': up.token },
        metadata: { bucketName: up.bucket, objectName: up.path, contentType: typeOf(file), cacheControl: '3600' },
        chunkSize: 6 * 1024 * 1024, // Supabase requires 6 MB chunks
        retryDelays: [0, 3000, 5000, 10000, 20000],
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        onProgress: (sent, total) => onProgress && onProgress(sent / total),
        onSuccess: resolve,
        onError: reject,
      });
      u.start();
    });
  }

  window.SubmitAPI = {
    async submit(payload, file, { onProgress } = {}) {
      try {
        const t = await getToken();
        if (!t) return { ok: false, error: 'turnstile' };
        const res = await fetch(`${FUNCTIONS}/meetup-submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: PUBLISHABLE_KEY },
          body: JSON.stringify({ token: t, payload, file: file ? { name: file.name, size: file.size, type: typeOf(file) } : null }),
        });
        useToken();
        const out = await res.json().catch(() => ({ ok: false, error: 'network' }));
        if (!out.ok) return out;
        if (file && out.upload) await upload(file, out.upload, onProgress);
        return { ok: true, id: out.id };
      } catch (e) {
        console.error(e);
        useToken();
        return { ok: false, error: 'network' };
      }
    },
  };
})();
