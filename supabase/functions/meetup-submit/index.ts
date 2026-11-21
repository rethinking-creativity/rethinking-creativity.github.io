// meetup-submit: takes one artwork submission from submit.html.
// Turnstile check -> input check (same limits as the form) -> insert row
// -> for a file, a signed upload token for meetup-works (the browser uploads it resumably, TUS).
// A file row counts as complete once its object exists in the bucket (storage.objects is the truth).
// Secrets: TURNSTILE_SECRET (MEETUP_ADMIN_KEY for organizer entries). No confirmation email is sent.
// No per-IP limit: Turnstile stops bots, and a venue network puts many people behind one IP.
import { cors, isOrganizer, json, sql, storage } from "../_shared/common.ts";

const MAX_FILE = 100 * 1024 * 1024;
const HOSTNAMES = ["rethinking-creativity.github.io", "localhost", "127.0.0.1"];
const FILE_TYPES: Record<string, RegExp> = {
  image: /^image\/[\w.+-]+$/,
  video: /^video\/[\w.+-]+$/,
  sound: /^audio\/[\w.+-]+$/,
  text: /^(text\/plain|text\/markdown|application\/pdf)$/,
};

class Bad extends Error {}

const str = (v: unknown, max: number, field: string, required = false): string | null => {
  if (v == null || v === "") { if (required) throw new Bad(field); return null; }
  if (typeof v !== "string") throw new Bad(field);
  const t = v.trim();
  if ((required && !t) || [...t].length > max) throw new Bad(field);
  return t || null;
};
const bool = (v: unknown, field: string): boolean => { if (typeof v !== "boolean") throw new Bad(field); return v; };

function check(p: Record<string, unknown>, file: Record<string, unknown> | null) {
  const medium = p.medium as string;
  if (!["text", "image", "video", "sound"].includes(medium)) throw new Bad("medium");
  const source = p.source as string;
  if (!["file", "link", "paste"].includes(source) || (source === "paste" && medium !== "text")) throw new Bad("source");

  const used_ai = bool(p.used_ai, "used_ai");
  if (!Array.isArray(p.process) || p.process.length > 5) throw new Bad("process");
  const process = p.process.map((r: Record<string, unknown>) => {
    if (!r || typeof r !== "object") throw new Bad("process");
    const step = str(r.step, 12, "process") || "";
    const by_hand = str(r.by_hand, 24, "process") || "";
    const with_ai = used_ai ? str(r.with_ai, 24, "process") || "" : "";
    return { step, by_hand, with_ai };
  }).filter((r) => r.by_hand || r.with_ai);

  const year = str(p.year, 4, "year");
  if (year && !/^\d{4}$/.test(year)) throw new Bad("year");
  const email = str(p.email, 254, "email", true)!;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Bad("email");
  if (p.rights_owned !== true || p.consent_show !== true) throw new Bad("consent");
  if (!["name", "anon"].includes(p.credit as string)) throw new Bad("credit");
  // Required by the form; optional here so a page cached from before the question still submits
  if (p.attending != null && !["yes", "unsure", "no"].includes(p.attending as string)) throw new Bad("attending");

  const row = {
    medium, source, used_ai, process: sql.json(process), year, email,
    title: str(p.title, 60, "title", true)!,
    materials: str(p.materials, 40, "materials"),
    description: str(p.description, 120, "description"),
    description_long: str(p.description_long, 1000, "description_long"),
    process_long: str(p.process_long, 1000, "process_long"),
    tool_wish: str(p.tool_wish, 500, "tool_wish"),
    name: str(p.name, 40, "name", true)!,
    credit: p.credit as string,
    attending: (p.attending as string | null) ?? null,
    rights_owned: true, consent_show: true,
    consent_web: bool(p.consent_web, "consent_web"),
    consent_future: bool(p.consent_future, "consent_future"),
    link: null as string | null, text: null as string | null,
    file_type: null as string | null, file_size: null as number | null,
  };
  if (source === "link") {
    row.link = str(p.link, 2000, "link", true);
    if (!/^https?:\/\/\S+$/i.test(row.link!)) throw new Bad("link");
  } else if (source === "paste") {
    row.text = str(p.text, 20000, "text", true);
  } else {
    const size = Number(file?.size), type = String(file?.type || "");
    if (!file || !Number.isInteger(size) || size < 1 || size > MAX_FILE) throw new Bad("file");
    if (!FILE_TYPES[medium].test(type)) throw new Bad("file_type");
    row.file_type = type;
    row.file_size = size;
  }
  return row;
}

async function turnstile(token: unknown, ip: string): Promise<boolean> {
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  const form = new FormData();
  form.append("secret", Deno.env.get("TURNSTILE_SECRET")!);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const out = await r.json().catch(() => ({}));
  return out.success === true && HOSTNAMES.includes(out.hostname);
}

// Object name inside the bucket: <row id>/work.<ext>; the person's file name is not kept
const ext = (name: unknown) => (String(name || "").match(/\.([a-z0-9]{1,8})$/i)?.[1] || "bin").toLowerCase();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { ok: false, error: "method" });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(req, 400, { ok: false, error: "json" }); }

  // On-site entry from the organizer's signed-in browser: trusted, so no Turnstile
  const organizer = await isOrganizer(req);
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  if (!organizer && !(await turnstile(body.token, ip))) return json(req, 403, { ok: false, error: "turnstile" });

  let row: ReturnType<typeof check>;
  try {
    row = check((body.payload || {}) as Record<string, unknown>, (body.file || null) as Record<string, unknown> | null);
  } catch (e) {
    if (e instanceof Bad) return json(req, 400, { ok: false, error: "invalid", field: e.message });
    throw e;
  }


  // Retry after a failed upload: the browser sends back the id it got; if that row is still
  // waiting for its file, it is updated and gets a new upload token instead of a second row.
  const fileName = (body.file as Record<string, unknown> | null)?.name;
  const resumeId = typeof body.resume_id === "string" && /^[0-9a-f-]{36}$/.test(body.resume_id) ? body.resume_id : null;
  if (resumeId) {
    const [old] = await sql`
      select s.id from meetup.submissions s
      where s.id = ${resumeId} and s.source = 'file'
        and s.created_at > now() - interval '1 day'
        and not exists (select 1 from storage.objects o where o.bucket_id = 'meetup-works' and o.name = s.file_path)`;
    if (old) {
      if (row.source === "file") {
        const file_path = `${resumeId}/work.${ext(fileName)}`;
        await sql`update meetup.submissions set ${sql({ ...row, file_path })} where id = ${resumeId}`;
        return await uploadReply(req, resumeId, file_path, false);
      }
      // Switched to a link or pasted text: the unfinished row goes, a new one is made below
      await sql`delete from meetup.submissions where id = ${resumeId}`;
    }
  }

  const id = crypto.randomUUID();
  const file_path = row.source === "file" ? `${id}/work.${ext(fileName)}` : null;
  await sql`insert into meetup.submissions ${sql({ id, ...row, file_path })}`;

  if (!file_path) return json(req, 200, { ok: true, id });
  return await uploadReply(req, id, file_path, true);
});

// Signed token for one resumable upload to file_path (upsert, so a retry may overwrite a partial file)
async function uploadReply(req: Request, id: string, file_path: string, fresh: boolean): Promise<Response> {
  const { data, error } = await storage.createSignedUploadUrl(file_path, { upsert: true });
  if (error || !data) {
    if (fresh) await sql`delete from meetup.submissions where id = ${id}`;
    return json(req, 500, { ok: false, error: "upload_url" });
  }
  return json(req, 200, { ok: true, id, upload: { bucket: "meetup-works", path: data.path, token: data.token } });
}
