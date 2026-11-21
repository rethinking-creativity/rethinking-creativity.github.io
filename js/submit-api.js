// Submission backend. PROTOTYPE: a stub that pretends to save.
// Later this file alone is replaced by the Supabase client (DB insert + Storage upload);
// submit.js only calls SubmitAPI.submit(payload, file) and expects { ok, id } or { ok: false, error }.
window.SubmitAPI = {
  async submit(payload, file) {
    console.info('[prototype] would save', payload, file ? `${file.name} (${file.size} bytes)` : 'no file');
    await new Promise((r) => setTimeout(r, 900));
    return { ok: true, id: 'demo-' + Date.now().toString(36) };
  },
};
