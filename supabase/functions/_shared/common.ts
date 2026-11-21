// Shared by meetup-submit and meetup-work: CORS for the site's origins, JSON replies,
// a direct Postgres connection (the meetup schema is not exposed through the REST API),
// and the private meetup-works bucket via the service role.
import postgres from "npm:postgres@3.4.5";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

export const BUCKET = "meetup-works";

const ORIGINS = [/^https:\/\/rethinking-creativity\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];

export function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const ok = ORIGINS.some((re) => re.test(origin));
  return {
    ...(ok ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-admin-key",
    "Vary": "Origin",
  };
}

export function json(req: Request, status: number, body: unknown, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json", "Cache-Control": "no-store", ...extra },
  });
}

export const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { max: 2, prepare: false, idle_timeout: 20 });

export const storage = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
).storage.from(BUCKET);

// Organizer password (x-admin-key) against the MEETUP_ADMIN_KEY secret, compared as hashes in constant time
const enc = new TextEncoder();
const digest = async (t: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(t)));
export async function isOrganizer(req: Request): Promise<boolean> {
  const want = Deno.env.get("MEETUP_ADMIN_KEY");
  const got = req.headers.get("x-admin-key") || "";
  if (!want || !got) return false;
  const [a, b] = await Promise.all([digest(want), digest(got)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
