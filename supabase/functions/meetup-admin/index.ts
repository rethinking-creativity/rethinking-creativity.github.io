// meetup-admin: the organizer page's backend (admin.html). Every request carries the organizer
// password in x-admin-key, checked against the MEETUP_ADMIN_KEY secret.
// POST { action, ... }:
//   list                      all submissions (with email; never the IP hash) + short-lived file URLs
//   status  { id, status }    active | withdrawn (no approval step)
//   printed { id, printed }   record that the card was printed (or undo)
//   delete  { id }            the row and every file under <id>/
//   cover_upload { id, ext }  signed upload for <id>/cover.<ext> (video frame / sound waveform made in the browser)
//   cover_set    { id, path } record the uploaded cover once the file exists
//   excerpt_set  { id, excerpt } opening lines of a PDF text work (read in the browser), for the card front
//   link_cover   { id }       fetch a linked work's thumbnail (YouTube, Vimeo, SoundCloud, else og:image) into <id>/cover.*
import { BUCKET, cors, isOrganizer, json, sql, storage } from "../_shared/common.ts";

const URL_TTL = 60 * 60;
const TEXT_INLINE_MAX = 200 * 1024;
const COVER_MAX = 5 * 1024 * 1024;
const objectExists = async (path: string | null) =>
  !!path && (await sql`select 1 from storage.objects where bucket_id = ${BUCKET} and name = ${path}`).length > 0;

async function list() {
  const rows = await sql`
    select s.id, s.qr_key, s.created_at, s.status, s.medium, s.source, s.link, s.text,
           s.file_path, s.file_type, s.file_size, s.cover_path, s.title, s.year, s.materials,
           s.description, s.description_long, s.used_ai, s.process, s.process_long, s.name, s.credit,
           s.email, s.attending, s.tool_wish, s.answers, s.practice, s.background, s.keep_posted, s.consent_web, s.consent_future, s.excerpt, s.printed_at,
           (s.source <> 'file' or exists (select 1 from storage.objects o where o.bucket_id = ${BUCKET} and o.name = s.file_path)) as file_ok,
           exists (select 1 from storage.objects o where o.bucket_id = ${BUCKET} and o.name = s.cover_path) as cover_ok
    from meetup.submissions s order by s.created_at`;
  const paths = rows.flatMap((r) => [r.file_ok && r.file_path, r.cover_ok && r.cover_path]).filter(Boolean) as string[];
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data } = await storage.createSignedUrls(paths, URL_TTL);
    (data || []).forEach((d) => d.signedUrl && d.path && signed.set(d.path, d.signedUrl));
  }
  const out = [];
  for (const r of rows) {
    const w: Record<string, unknown> = { ...r, file_path: undefined, cover_path: undefined, has_cover: r.cover_ok };
    const file = r.file_ok && r.file_path ? signed.get(r.file_path) : undefined;
    const cover = r.cover_ok && r.cover_path ? signed.get(r.cover_path) : undefined;
    if (file) {
      if (r.file_type === "application/pdf") w.pdf = file;
      else if (r.medium === "text" && /^text\//.test(r.file_type) && r.file_size <= TEXT_INLINE_MAX) {
        const { data } = await storage.download(r.file_path);
        if (data) w.text = await data.text();
      } else w.src = file;
    }
    // The cover stands in for the picture the card front needs
    if (cover) {
      if (r.medium === "video") w.poster = cover;
      else if (r.medium === "sound") w.art = cover;
      else if (r.medium === "image" && !file) w.src = cover;
    }
    out.push(w);
  }
  return out;
}

// A linked work's thumbnail: known services first, then the page's og:image
async function thumbnailURL(link: string): Promise<string | null> {
  const u = new URL(link);
  const host = u.hostname.replace(/^www\.|^m\./, "");
  let yt: string | null = null;
  if (host === "youtu.be") yt = u.pathname.slice(1).split("/")[0];
  else if (host.endsWith("youtube.com")) yt = u.searchParams.get("v") || u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/)?.[1] || null;
  if (yt && /^[\w-]{6,}$/.test(yt)) {
    for (const size of ["maxresdefault", "hqdefault"]) {
      const t = `https://i.ytimg.com/vi/${yt}/${size}.jpg`;
      if ((await fetch(t, { method: "HEAD" })).ok) return t;
    }
  }
  const oembed = host.endsWith("vimeo.com") ? `https://vimeo.com/api/oembed.json?width=1280&url=${encodeURIComponent(link)}`
    : host.endsWith("soundcloud.com") ? `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(link)}`
    : null;
  if (oembed) {
    const r = await fetch(oembed);
    if (r.ok) { const d = await r.json(); if (d.thumbnail_url) return d.thumbnail_url; }
  }
  const page = await fetch(link, { headers: { "user-agent": "Mozilla/5.0 (compatible; meetup-cover/1.0)" }, redirect: "follow" });
  if (!page.ok || !/text\/html/.test(page.headers.get("content-type") || "")) return null;
  const html = (await page.text()).slice(0, 300_000);
  const og = html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  return og ? new URL(og[1].replace(/&amp;/g, "&"), page.url).href : null;
}

async function linkCover(id: string) {
  const [r] = await sql`select link from meetup.submissions where id = ${id}`;
  if (!r?.link) return { ok: false, error: "no_link" };
  const t = await thumbnailURL(r.link).catch(() => null);
  if (!t || !/^https:\/\//.test(t)) return { ok: false, error: "no_thumbnail" };
  const img = await fetch(t);
  const type = img.headers.get("content-type") || "";
  const ext = /png/.test(type) ? "png" : /jpe?g/.test(type) ? "jpg" : null;
  const bytes = new Uint8Array(await img.arrayBuffer());
  if (!img.ok || !ext || bytes.length > COVER_MAX) return { ok: false, error: "no_thumbnail" };
  const path = `${id}/cover.${ext}`;
  const { error } = await storage.upload(path, bytes, { contentType: type, upsert: true });
  if (error) return { ok: false, error: "upload" };
  await sql`update meetup.submissions set cover_path = ${path} where id = ${id}`;
  return { ok: true };
}

const isId = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/.test(v);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { ok: false, error: "method" });
  if (!(await isOrganizer(req))) {
    await new Promise((r) => setTimeout(r, 800)); // slows password guessing
    return json(req, 401, { ok: false, error: "auth" });
  }
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json(req, 400, { ok: false, error: "json" }); }
  const id = b.id;

  switch (b.action) {
    case "signin":
      return json(req, 200, { ok: true });
    case "list":
      return json(req, 200, { ok: true, works: await list() });
    case "status": {
      if (!isId(id) || !["active", "withdrawn"].includes(b.status as string)) break;
      await sql`update meetup.submissions set status = ${b.status as string} where id = ${id}`;
      return json(req, 200, { ok: true });
    }
    case "printed": {
      if (!isId(id) || typeof b.printed !== "boolean") break;
      await sql`update meetup.submissions set printed_at = ${b.printed ? sql`now()` : null} where id = ${id}`;
      return json(req, 200, { ok: true });
    }
    case "delete": {
      if (!isId(id)) break;
      const objs = await sql`select name from storage.objects where bucket_id = ${BUCKET} and name like ${id + "/%"}`;
      if (objs.length) {
        const { error } = await storage.remove(objs.map((o) => o.name as string));
        if (error) return json(req, 500, { ok: false, error: "storage" });
      }
      await sql`delete from meetup.submissions where id = ${id}`;
      return json(req, 200, { ok: true });
    }
    case "cover_upload": {
      if (!isId(id) || !["jpg", "png", "svg"].includes(b.ext as string)) break;
      const { data, error } = await storage.createSignedUploadUrl(`${id}/cover.${b.ext}`, { upsert: true });
      if (error || !data) return json(req, 500, { ok: false, error: "upload_url" });
      return json(req, 200, { ok: true, path: data.path, token: data.token });
    }
    case "cover_set": {
      const path = b.path;
      if (!isId(id) || typeof path !== "string" || !path.startsWith(`${id}/cover.`) || !(await objectExists(path))) break;
      await sql`update meetup.submissions set cover_path = ${path} where id = ${id}`;
      return json(req, 200, { ok: true });
    }
    case "excerpt_set": {
      const t = typeof b.excerpt === "string" ? b.excerpt.trim().slice(0, 300) : "";
      if (!isId(id) || !t) break;
      await sql`update meetup.submissions set excerpt = ${t} where id = ${id}`;
      return json(req, 200, { ok: true });
    }
    case "link_cover":
      if (!isId(id)) break;
      return json(req, 200, await linkCover(id));
  }
  return json(req, 400, { ok: false, error: "invalid" });
});
