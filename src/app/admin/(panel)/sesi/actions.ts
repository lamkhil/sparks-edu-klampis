"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { countActive, getSessionById } from "@/lib/data";
import { defaultFields, fieldsSchema } from "@/lib/form-schema";
import { sendConfirmation } from "@/lib/mailer";
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
  revalidatePath("/admin");
  redirect("/admin");
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
  if (v.opens_at && v.closes_at && v.opens_at >= v.closes_at) return { ok: false, error: "Waktu tutup harus setelah waktu buka" };
  const used = await countActive(id);
  if (v.quota < used) return { ok: false, error: `Kuota tidak boleh kurang dari jumlah yang sudah terisi (${used})` };

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
  }
  await createAdminClient().from("submissions").update({ status }).eq("id", id);
  revalidatePath(`/admin/sesi/${sub.session_id}/submisi`);
  return { ok: true };
}

export async function resendEmail(id: string) {
  await requireAdmin();
  const sub = await getSub(id);
  if (!sub) return { ok: false, error: "Tidak ditemukan" };
  const s = await getSessionById(sub.session_id);
  if (!s) return { ok: false, error: "Sesi tidak ditemukan" };
  const res = await sendConfirmation({ ...s, email_enabled: true }, sub);
  revalidatePath(`/admin/sesi/${sub.session_id}/submisi`);
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export async function deleteSubmission(id: string) {
  await requireAdmin();
  const sub = await getSub(id);
  if (!sub) return { ok: false, error: "Tidak ditemukan" };
  await createAdminClient().from("submissions").delete().eq("id", id);
  revalidatePath(`/admin/sesi/${sub.session_id}/submisi`);
  return { ok: true };
}
