// meetup-work: one live (not withdrawn) work for its QR page, looked up by qr_key (GET ?k=<qr_key>).
// After MEETUP_END only works with consent_web stay open; the rest answer { closed: true }.
// Returns only what the page shows: never email, IP hash, ids, status or consent flags.
// Files go out as short-lived signed URLs. Config: MEETUP_END (ISO date, default 2027-05-15).
import { cors, json, sql, step, storage } from "../_shared/common.ts";

const URL_TTL = 15 * 60; // seconds; long enough to watch a video, short enough not to be a permanent link
const TEXT_INLINE_MAX = 200 * 1024;

// The meet-up runs through the end of MEETUP_END's day
function closedNow(): boolean {
  const end = Date.parse(`${Deno.env.get("MEETUP_END") || "2027-05-15"}T23:59:59Z`);
  return Number.isFinite(end) && Date.now() > end;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "GET") return json(req, 405, { error: "method" });

  const k = new URL(req.url).searchParams.get("k") || "";
  if (!/^[0-9a-f]{12}$/.test(k)) return json(req, 404, { found: false });

  const [w] = await step("db", () => sql`
    select medium, title, year, materials, description, description_long, process, process_long,
           credit, name, link, text, file_path, file_type, file_size, cover_path, consent_web
    from meetup.submissions where qr_key = ${k} and status = 'active'`);
  if (!w) return json(req, 404, { found: false });
  if (closedNow() && !w.consent_web) return json(req, 200, { closed: true });

  const out: Record<string, unknown> = {
    id: k, medium: w.medium, title: w.title, year: w.year || "", materials: w.materials || "",
    description: w.description || "", description_long: w.description_long || "",
    process: w.process || [], process_long: w.process_long || "",
    credit: w.credit, name: w.credit === "anon" ? "Anonymous" : w.name,
  };
  if (w.link) out.link = w.link;
  if (w.text) out.text = w.text;
  if (w.file_path) {
    // A plain-text file is shown as text; anything else as a signed file URL
    if (w.medium === "text" && /^text\//.test(w.file_type) && w.file_size <= TEXT_INLINE_MAX) {
      const { data } = await step("download", () => storage.download(w.file_path));
      if (data) out.text = await data.text();
    } else {
      const { data } = await step("sign", () => storage.createSignedUrl(w.file_path, URL_TTL));
      if (data?.signedUrl) out[w.file_type === "application/pdf" ? "pdf" : "src"] = data.signedUrl;
    }
  }
  // Cover (video frame, sound waveform, linked work's thumbnail): the video still and the sound artwork
  if (w.cover_path && (w.medium === "video" || w.medium === "sound")) {
    const { data } = await step("sign-cover", () => storage.createSignedUrl(w.cover_path, URL_TTL));
    if (data?.signedUrl) out[w.medium === "video" ? "poster" : "art"] = data.signedUrl;
  }
  return json(req, 200, out);
});
