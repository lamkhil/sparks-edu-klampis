"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/components/dynamic-form";
import { grantAccess, hasAccess } from "@/lib/access";
import { getSubmissionByCode, normalizeCode } from "@/lib/data";
import { emailKey, readFormData, validateAnswers } from "@/lib/form-schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { canModify } from "@/lib/types";

export type LookupState = { message?: string; kode?: string; email?: string } | null;

export async function lookup(_: LookupState, fd: FormData): Promise<LookupState> {
  const kode = normalizeCode(String(fd.get("kode") ?? ""));
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const found = kode.length > 3 && email ? await getSubmissionByCode(kode) : null;
  // Pesan sama untuk kode salah maupun email salah, agar tidak bisa menebak.
  if (!found || found.submission.email.toLowerCase() !== email)
    return { message: "Kode atau email tidak cocok.", kode, email };
  await grantAccess(found.submission.code);
  redirect(`/cek/${found.submission.code}`);
}

async function load(code: string) {
  if (!(await hasAccess(code))) redirect(`/cek?kode=${code}`);
  const found = await getSubmissionByCode(code);
  if (!found) redirect("/cek");
  return found;
}

export async function updateAnswers(code: string, prev: FormState, fd: FormData): Promise<FormState> {
  const { session, submission } = await load(code);
  const nonce = (prev?.nonce ?? 0) + 1;
  if (submission.status !== "active" || !canModify(session).edit) return { message: "Isian ini tidak bisa diubah lagi.", nonce };

  const raw = readFormData(session.fields, fd);
  // Email adalah kunci verifikasi, tidak boleh diubah.
  raw[emailKey(session.fields)] = submission.email;
  const v = validateAnswers(session.fields, raw);
  if (!v.ok) return { errors: v.errors, message: "Periksa kembali isian yang ditandai.", values: raw, nonce };

  const { error } = await createAdminClient()
    .from("submissions")
    .update({ answers: v.data })
    .eq("id", submission.id)
    .eq("status", "active");
  if (error) return { message: "Gagal menyimpan, coba lagi.", values: raw, nonce };
  return { success: "Perubahan tersimpan.", values: v.data, nonce };
}

export async function cancelSubmission(code: string) {
  const { session, submission } = await load(code);
  if (submission.status === "active" && canModify(session).cancel) {
    await createAdminClient().from("submissions").update({ status: "cancelled" }).eq("id", submission.id);
  }
  redirect(`/cek/${code}`);
}

