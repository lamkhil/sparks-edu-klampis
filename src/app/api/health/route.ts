import { SUPABASE_PUBLIC_KEY, SUPABASE_URL, appUrl } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const has = (k: string) => Boolean(process.env[k]?.trim());

/** Cek kesehatan: hanya melaporkan ADA/TIDAK-nya konfigurasi, tidak pernah nilainya. */
export async function GET() {
  const keys = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SECRET_KEY",
    "APP_URL",
    "APP_SECRET",
  ];
  const env = Object.fromEntries(keys.map((k) => [k, has(k)]));
  let urlValid = false;
  try {
    const u = new URL(SUPABASE_URL ?? "");
    urlValid = u.protocol === "https:" && u.hostname.endsWith(".supabase.co");
  } catch {}
  let db: string;
  try {
    const { error } = await createAdminClient().from("sessions").select("id", { head: true, count: "exact" });
    db = error ? `error: ${error.message}` : "ok";
  } catch (e) {
    db = `exception: ${e instanceof Error ? e.message : String(e)}`;
  }
  return Response.json({ env, appUrl: appUrl(), supabaseUrlValid: urlValid, publicKeyPresent: Boolean(SUPABASE_PUBLIC_KEY), db });
}
