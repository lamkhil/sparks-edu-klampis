"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { countActive, getSessionById, slotUsage } from "@/lib/data";
import { defaultFields, fieldsSchema, fileFields, guestField, slotField, slotsTotal } from "@/lib/form-schema";
import { sendConfirmation, sendMail } from "@/lib/mailer";
import { DEFAULT_REMINDERS, escapeHtml, renderTemplate, stripCopyMarks } from "@/lib/template";
import { fullTemplateVars } from "@/lib/template-server";
import { promoSchema } from "@/lib/promo";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Submission } from "@/lib/types";

function randomSlug() {
  return `sesi-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createSession() {
  await requireAdmin();
  const { data, error } = await createAdminClient()
    .from("sessions")
    .insert({ title: "Sesi baru", slug: randomSlug(), fields: defaultFields() })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  redirect(`/admin/sesi/${data.id}`);
}

export async function duplicateSession(id: string) {
  await requireAdmin();
  const s = await getSessionById(id);
  if (!s) return;
  const rest: Partial<typeof s> = { ...s };
  delete rest.id;
  delete rest.created_at;
  delete rest.updated_at;
  const { data, error } = await createAdminClient()
    .from("sessions")
    .insert({ ...rest, title: `${s.title} (salinan)`, slug: `${s.slug}-${Math.random().toString(36).slice(2, 5)}`.slice(0, 60), status: "draft" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  redirect(`/admin/sesi/${data.id}`);
}

export async function deleteSession(id: string) {
  await requireAdmin();
  await createAdminClient().from("sessions").delete().eq("id", id);
  revalidatePath("/admin/sesi");
  redirect("/admin/sesi");
}

const isoOrNull = z
  .string()
  .nullable()
  .transform((v) => (v ? new Date(v).toISOString() : null));

const sessionSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug hanya huruf kecil, angka, dan tanda hubung")
    .max(60),
  description: z.string().max(5000),
  status: z.enum(["draft", "published", "closed"]),
  quota: z.coerce.number().int().min(0, "Kuota minimal 0").max(1_000_000),
  opens_at: isoOrNull,
  closes_at: isoOrNull,
  fields: fieldsSchema,
  success_message: z.string().max(5000),
  email_enabled: z.boolean(),
  email_subject: z.string().max(300),
  email_body: z.string().max(10000),
  allow_view: z.boolean(),
  allow_edit: z.boolean(),
  allow_cancel: z.boolean(),
  edit_deadline: isoOrNull,
  one_per_email: z.boolean(),
  track_payment: z.boolean(),
  promo: promoSchema,
  reminders: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        name: z.string().trim().min(1, "Nama pengingat wajib diisi").max(60),
        text: z.string().trim().min(1, "Teks pengingat wajib diisi").max(3000),
        email_subject: z.string().max(200).optional(),
      }),
    )
    .max(10),
});

export type SessionInput = z.input<typeof sessionSchema>;
export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveSession(id: string, input: SessionInput): Promise<SaveResult> {
  await requireAdmin();
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { ok: false, error: i.message };
  }
  const v = parsed.data;
  // Kuota sesi mengikuti total kuota jadwal jika form memakai jadwal berkuota.
  v.quota = slotsTotal(v.fields) ?? v.quota;
  if (v.opens_at && v.closes_at && v.opens_at >= v.closes_at) return { ok: false, error: "Waktu tutup harus setelah waktu buka" };
  const used = await countActive(id);
  if (v.quota < used) return { ok: false, error: `Kuota tidak boleh kurang dari jumlah yang sudah terisi (${used})` };
  const sf = slotField(v.fields);
  if (sf?.slots) {
    const usage = await slotUsage(id);
    for (const sl of sf.slots) {
      const u = usage[sl.id];
      if (u && sl.quota < u.used) return { ok: false, error: `Kuota "${sl.label}" tidak boleh kurang dari pendaftar yang sudah ada (${u.used})` };
    }
  }

  const { error } = await createAdminClient().from("sessions").update(v).eq("id", id);
  if (error) return { ok: false, error: error.code === "23505" ? "Slug sudah dipakai sesi lain" : error.message };
  revalidatePath(`/admin/sesi/${id}`);
  revalidatePath(`/s/${v.slug}`);
  return { ok: true };
}

// ---------- Submissions ----------

async function getSub(id: string) {
  const { data } = await createAdminClient().from("submissions").select("*").eq("id", id).single();
  return data as Submission | null;
}

export async function setSubmissionStatus(id: string, status: "active" | "cancelled") {
  await requireAdmin();
  const sub = await getSub(id);
  if (!sub) return { ok: false, error: "Tidak ditemukan" };
  if (status === "active" && sub.status !== "active") {
    const s = await getSessionById(sub.session_id);
    if (s && (await countActive(s.id)) >= s.quota) return { ok: false, error: "Kuota penuh, naikkan kuota dulu untuk memulihkan." };
    const sf = s ? slotField(s.fields) : undefined;
    const sl = s && sub.slot ? sf?.slots?.find((x) => x.id === sub.slot) : undefined;
    if (s && sl) {
      const usage = await slotUsage(s.id);
      const u = usage[sl.id] ?? { used: 0, guests: 0 };
      if (u.used >= sl.quota) return { ok: false, error: `Jadwal "${sl.label}" sudah penuh.` };
      if (guestField(s.fields) && sub.guest_slots) {
        for (const [gid, n] of Object.entries(sub.guest_slots)) {
          if (!n) continue;
          const gsl = sf?.slots?.find((x) => x.id === gid);
          const gu = usage[gid] ?? { used: 0, guests: 0 };
          if (gsl && gu.guests + n > gsl.guest_quota)
            return { ok: false, error: `Kuota teman di "${gsl.label}" tidak cukup untuk memulihkan pendaftaran ini.` };
        }
      }
    }
  }
  await createAdminClient().from("submissions").update({ status }).eq("id", id);
  revalidatePath(`/admin/sesi/${sub.session_id}/submisi`);
  return { ok: true };
}

export async function resendEmail(id: string) {
  await requireAdmin();
  const sub = await getSub(id);
  if (!sub) return { ok: false, error: "Tidak ditemukan" };
  if (!sub.email) return { ok: false, error: "Pendaftar ini tidak mengisi email." };
  const s = await getSessionById(sub.session_id);
  if (!s) return { ok: false, error: "Sesi tidak ditemukan" };
  const res = await sendConfirmation({ ...s, email_enabled: true }, sub);
  revalidatePath(`/admin/sesi/${sub.session_id}/submisi`);
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

/** URL upload bertanda tangan: browser mengunggah poster langsung ke Supabase Storage. */
export async function createPosterUpload(sessionId: string, ext: string) {
  await requireAdmin();
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const path = `${sessionId}/${Date.now()}.${safeExt}`;
  const storage = createAdminClient().storage.from("posters");
  const { data, error } = await storage.createSignedUploadUrl(path);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, path, token: data.token, publicUrl: storage.getPublicUrl(path).data.publicUrl };
}

export async function setPaymentStatus(id: string, status: "pending" | "paid" | "rejected") {
  await requireAdmin();
  const sub = await getSub(id);
  if (!sub) return { ok: false, error: "Tidak ditemukan" };
  await createAdminClient().from("submissions").update({ payment_status: status }).eq("id", id);
  revalidatePath(`/admin/sesi/${sub.session_id}/submisi`);
  return { ok: true };
}

export async function deleteSubmission(id: string) {
  await requireAdmin();
  const sub = await getSub(id);
  if (!sub) return { ok: false, error: "Tidak ditemukan" };
  const db = createAdminClient();
  await db.from("submissions").delete().eq("id", id);
  // Hapus juga file bukti transfer milik pendaftar ini.
  const s = await getSessionById(sub.session_id);
  const paths = (s ? fileFields(s.fields) : []).map((f) => sub.answers[f.key]).filter((p): p is string => typeof p === "string" && p !== "");
  if (paths.length) await db.storage.from("payments").remove(paths);
  revalidatePath(`/admin/sesi/${sub.session_id}/submisi`);
  return { ok: true };
}

/** Kirim pengingat via email ke pendaftar terpilih yang punya email. */
export async function sendReminderEmails(sessionId: string, reminderId: string, submissionIds: string[]) {
  await requireAdmin();
  const session = await getSessionById(sessionId);
  if (!session) return { ok: false as const, error: "Sesi tidak ditemukan" };
  const reminder = (session.reminders?.length ? session.reminders : DEFAULT_REMINDERS).find((r) => r.id === reminderId);
  if (!reminder) return { ok: false as const, error: "Template pengingat tidak ditemukan" };
  const { data } = await createAdminClient().from("submissions").select("*").eq("session_id", sessionId).in("id", submissionIds.slice(0, 500));
  let sent = 0;
  const failed: string[] = [];
  for (const sub of (data ?? []) as Submission[]) {
    if (!sub.email) continue;
    const vars = fullTemplateVars(session, sub);
    const text = stripCopyMarks(renderTemplate(reminder.text, vars));
    const subject = stripCopyMarks(renderTemplate(reminder.email_subject || reminder.name, vars));
    try {
      await sendMail(sub.email, subject, text, `<div style="font-family:system-ui,Arial,sans-serif;font-size:15px;line-height:1.6">${escapeHtml(text).replace(/\n/g, "<br>")}</div>`);
      sent++;
    } catch {
      failed.push(sub.code);
    }
  }
  return { ok: true as const, sent, failed };
}
