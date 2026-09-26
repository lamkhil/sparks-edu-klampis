import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { Session, SlotUsage, Submission } from "./types";

export async function getSessionBySlug(slug: string) {
  const { data } = await createAdminClient().from("sessions").select("*").eq("slug", slug).maybeSingle();
  return data as Session | null;
}

export async function getSessionById(id: string) {
  const { data } = await createAdminClient().from("sessions").select("*").eq("id", id).maybeSingle();
  return data as Session | null;
}

export async function countActive(sessionId: string) {
  const { count } = await createAdminClient()
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("status", "active");
  return count ?? 0;
}

export async function getSubmissionByCode(code: string) {
  const { data } = await createAdminClient()
    .from("submissions")
    .select("*, session:sessions(*)")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  if (!data) return null;
  const { session, ...sub } = data as Submission & { session: Session };
  return { submission: sub as Submission, session };
}

/** Normalisasi input kode: "sk7f3k9q" → "SK-7F3K9Q" */
export function normalizeCode(input: string) {
  const s = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = s.startsWith("SK") ? s.slice(2) : s;
  return `SK-${body}`;
}

/** Jumlah peserta & teman aktif per jadwal. */
export async function slotUsage(sessionId: string): Promise<SlotUsage> {
  const { data } = await createAdminClient()
    .from("submissions")
    .select("slot, guest_count")
    .eq("session_id", sessionId)
    .eq("status", "active")
    .not("slot", "is", null);
  const out: SlotUsage = {};
  for (const r of data ?? []) {
    const k = r.slot as string;
    out[k] ??= { used: 0, guests: 0 };
    out[k].used += 1;
    out[k].guests += Number(r.guest_count) || 0;
  }
  return out;
}
