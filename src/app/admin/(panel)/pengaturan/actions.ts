"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getSettings, sendMail } from "@/lib/mailer";
import { createAdminClient } from "@/lib/supabase/admin";

export type SettingsState = { ok?: string; error?: string } | null;

const schema = z.object({
  smtp_host: z.string().trim().min(1, "Host SMTP wajib diisi"),
  smtp_port: z.coerce.number().int().min(1).max(65535),
  smtp_secure: z.boolean(),
  smtp_user: z.string().trim(),
  smtp_pass: z.string(),
  mail_from_name: z.string().trim(),
  mail_from_email: z.email("Email pengirim tidak valid"),
});

export async function saveSettings(_: SettingsState, fd: FormData): Promise<SettingsState> {
  await requireAdmin();
  const parsed = schema.safeParse({
    smtp_host: fd.get("smtp_host"),
    smtp_port: fd.get("smtp_port"),
    smtp_secure: fd.get("smtp_secure") === "on",
    smtp_user: fd.get("smtp_user") ?? "",
    smtp_pass: fd.get("smtp_pass") ?? "",
    mail_from_name: fd.get("mail_from_name") ?? "",
    mail_from_email: fd.get("mail_from_email"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { smtp_pass, ...rest } = parsed.data;
  // Password kosong = tidak diubah
  const update = smtp_pass ? { ...rest, smtp_pass } : rest;
  const { error } = await createAdminClient().from("settings").update(update).eq("id", 1);
  if (error) return { error: error.message };

  const to = String(fd.get("test_to") ?? "").trim();
  if (fd.get("intent") === "test" && to) {
    try {
      await sendMail(to, "Tes SMTP Form Berkuota", "SMTP berhasil dikonfigurasi.", "<p>SMTP berhasil dikonfigurasi. ✅</p>", await getSettings());
      return { ok: `Tersimpan. Email tes terkirim ke ${to}.` };
    } catch (e) {
      return { error: `Tersimpan, tapi email tes gagal: ${e instanceof Error ? e.message : e}` };
    }
  }
  return { ok: "Tersimpan." };
}
