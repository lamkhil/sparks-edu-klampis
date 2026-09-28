import { requireAdmin } from "@/lib/auth";
import { getSessionById } from "@/lib/data";
import { fileFields, formatFieldAnswer, guestField, guestSlotsBreakdown, slotField } from "@/lib/form-schema";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Submission } from "@/lib/types";

function csvCell(v: string) {
  // Cegah formula injection di Excel/Sheets
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return /[",\n\r;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

const PAY = { none: "", pending: "Menunggu", paid: "Lunas", rejected: "Ditolak" };
const STATUS = { active: "Aktif", cancelled: "Dibatalkan" };

export async function GET(_: Request, ctx: RouteContext<"/admin/sesi/[id]/export">) {
  await requireAdmin();
  const { id } = await ctx.params;
  const session = await getSessionById(id);
  if (!session) return new Response("Not found", { status: 404 });
  const db = createAdminClient();
  const { data } = await db.from("submissions").select("*").eq("session_id", id).order("created_at");
  const sf = slotField(session.fields);
  const gf = guestField(session.fields);
  const files = fileFields(session.fields);
  const order = new Map((sf?.slots ?? []).map((s, i) => [s.id, i]));
  // Urutkan per jadwal agar mudah disetor per sesi.
  const subs = ((data ?? []) as Submission[]).sort((a, b) => (order.get(a.slot ?? "") ?? 99) - (order.get(b.slot ?? "") ?? 99));

  // Link bukti transfer berlaku 7 hari.
  const paths = subs.flatMap((s) => files.map((f) => s.answers[f.key]).filter((p): p is string => typeof p === "string" && p !== ""));
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await db.storage.from("payments").createSignedUrls(paths, 7 * 24 * 3600);
    for (const s of signed ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }

  const cols = session.fields.filter((f) => f.type !== "slot");
  const header = [
    "Kode",
    "Status",
    "Waktu daftar (WIB)",
    ...(sf ? ["Jadwal", "Jumlah teman"] : []),
    ...(gf ? ["Jadwal teman"] : []),
    ...(session.track_payment || files.length ? ["Pembayaran"] : []),
    "Total (Rp)",
    "Email konfirmasi",
    ...cols.map((f) => f.label),
  ];
  const rows = subs.map((s) => [
    s.code,
    STATUS[s.status],
    new Date(s.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
    ...(sf ? [formatFieldAnswer(sf, s.slot), String(s.guest_count)] : []),
    ...(gf ? [guestSlotsBreakdown(s.guest_slots, sf?.slots)] : []),
    ...(session.track_payment || files.length ? [PAY[s.payment_status]] : []), s.amount ?? "",
    s.email_status,
    ...cols.map((f) => (f.type === "file" ? (urls.get(String(s.answers[f.key] ?? "")) ?? "") : formatFieldAnswer(f, s.answers[f.key], sf?.slots))),
  ]);
  const csv = "﻿" + [header, ...rows].map((r) => r.map((c) => csvCell(String(c))).join(",")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${session.slug}.csv"`,
    },
  });
}
