"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/dynamic-form";
import { getSessionBySlug } from "@/lib/data";
import { emailKey, readFormData, validateAnswers } from "@/lib/form-schema";
import { sendConfirmation } from "@/lib/mailer";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Submission } from "@/lib/types";

const ERRORS: Record<string, string> = {
  QUOTA_FULL: "Maaf, kuota sudah penuh.",
  SESSION_CLOSED: "Pendaftaran sudah ditutup.",
  SESSION_NOT_OPEN: "Pendaftaran belum dibuka.",
  SESSION_NOT_FOUND: "Sesi tidak ditemukan.",
  EMAIL_ALREADY_SUBMITTED: "Email ini sudah terdaftar di sesi ini. Gunakan menu Cek Ulang untuk melihat isianmu.",
};

export async function submitForm(slug: string, prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSessionBySlug(slug);
  if (!session) return { message: ERRORS.SESSION_NOT_FOUND };

  // Honeypot anti-bot sederhana
  if (fd.get("website")) return { message: "Gagal mengirim." };

  const raw = readFormData(session.fields, fd);
  const nonce = (prev?.nonce ?? 0) + 1;
  const v = validateAnswers(session.fields, raw);
  if (!v.ok) return { errors: v.errors, message: "Periksa kembali isian yang ditandai.", values: raw, nonce };

  const email = String(v.data[emailKey(session.fields)]).toLowerCase();
  const db = createAdminClient();
  const { data, error } = await db.rpc("submit_form", { p_session_id: session.id, p_email: email, p_answers: v.data });
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
