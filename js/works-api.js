// Real works for the QR page: work.html?k=<qr_key> asks the meetup-work Edge Function.
// The four sample works (work.html?id=kettle, ...) still come from works-mock.js.
// byKey resolves to a work object, { closed: true } once the meet-up is over and the work
// is not kept online, or null.
(function () {
  const FUNCTIONS = 'https://rojnzjoznpkcqfgweohk.supabase.co/functions/v1';
  const PUBLISHABLE_KEY = 'sb_publishable_xhLGR-vUiEERd5hWaparrA_n1HSyJYn'; // public by design
  window.WorksAPI.byKey = async (k) => {
    if (!/^[0-9a-f]{12}$/.test(k || '')) return null;
    const res = await fetch(`${FUNCTIONS}/meetup-work?k=${k}`, { headers: { apikey: PUBLISHABLE_KEY } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`meetup-work ${res.status}`);
    return res.json();
  };
})();
