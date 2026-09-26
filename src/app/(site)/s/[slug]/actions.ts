"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/dynamic-form";
import { getSessionBySlug } from "@/lib/data";
import { emailKey, fileFields, guestField, readFormData, slotField, validateAnswers } from "@/lib/form-schema";
import { sendConfirmation } from "@/lib/mailer";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Submission } from "@/lib/types";

const ERRORS: Record<string, string> = {
  QUOTA_FULL: "Maaf, kuota sudah penuh.",
  SLOT_FULL: "Maaf, jadwal yang kamu pilih baru saja penuh. Silakan pilih jadwal lain.",
  GUEST_FULL: "Maaf, kuota teman untuk jadwal ini sudah habis. Kamu tetap bisa mendaftar tanpa membawa teman.",
  SLOT_INVALID: "Jadwal tidak valid.",
  SESSION_CLOSED: "Pendaftaran sudah ditutup.",
  SESSION_NOT_OPEN: "Pendaftaran belum dibuka.",
  SESSION_NOT_FOUND: "Sesi tidak ditemukan.",
  EMAIL_ALREADY_SUBMITTED: "Email ini sudah terdaftar di sesi ini. Gunakan menu Cek Ulang untuk melihat isianmu.",
};

/** Folder upload bukti untuk sebuah sesi. */
const proofPrefix = (sessionId: string) => `proofs/${sessionId}`;

/** URL upload bertanda tangan agar browser bisa mengunggah bukti transfer langsung ke bucket privat. */
export async function createProofUpload(slug: string, ext: string) {
  const session = await getSessionBySlug(slug);
  if (!session || session.status !== "published" || fileFields(session.fields).length === 0) return { ok: false as const, error: "Sesi tidak menerima upload" };
  const safeExt = ["jpg", "jpeg", "png", "webp", "pdf"].includes(ext) ? ext : "jpg";
  const path = `${proofPrefix(session.id)}/${crypto.randomUUID()}.${safeExt}`;
  const { data, error } = await createAdminClient().storage.from("payments").createSignedUploadUrl(path);
  if (error) return { ok: false as const, error: "Gagal menyiapkan upload" };
  return { ok: true as const, path, token: data.token };
}

export async function submitForm(slug: string, prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSessionBySlug(slug);
  if (!session) return { message: ERRORS.SESSION_NOT_FOUND };

  // Honeypot anti-bot sederhana
  if (fd.get("website")) return { message: "Gagal mengirim." };

  const raw = readFormData(session.fields, fd);
  const nonce = (prev?.nonce ?? 0) + 1;
  const v = validateAnswers(session.fields, raw, proofPrefix(session.id));
  if (!v.ok) return { errors: v.errors, message: "Periksa kembali isian yang ditandai.", values: raw, nonce };

  const email = String(v.data[emailKey(session.fields)]).toLowerCase();
  const sf = slotField(session.fields);
  const gf = guestField(session.fields);
  const slot = sf ? String(v.data[sf.key]) : null;
  const guests = gf ? (v.data[gf.key] as unknown[]).length : 0;
  const hasProof = fileFields(session.fields).length > 0;

  const db = createAdminClient();
  const { data, error } = await db.rpc("submit_form", {
    p_session_id: session.id,
    p_email: email,
    p_answers: v.data,
    p_slot: slot,
    p_guests: guests,
    p_payment_status: hasProof ? "pending" : "none",
  });
  if (error) {
    const code = Object.keys(ERRORS).find((k) => error.message.includes(k));
    return { message: code ? ERRORS[code] : "Terjadi kesalahan, coba lagi.", values: raw, nonce };
  }
  const row = (Array.isArray(data) ? data[0] : data) as { code: string; submission_id: string };

  const { data: sub } = await db.from("submissions").select("*").eq("id", row.submission_id).single();
  if (sub) await sendConfirmation(session, sub as Submission);

  (await cookies()).set(`done_${session.id}`, row.code, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60, path: "/" });
  redirect(`/s/${slug}/selesai`);
}
