import "server-only";
import nodemailer from "nodemailer";
import { createAdminClient } from "./supabase/admin";
import { escapeHtml, renderTemplate, templateVars } from "./template";
import { formatFieldAnswer } from "./form-schema";
import type { Session, Settings, Submission } from "./types";

export async function getSettings(): Promise<Settings> {
  const { data, error } = await createAdminClient().from("settings").select("*").eq("id", 1).single();
  if (error) throw new Error(error.message);
  return data as Settings;
}

function transport(s: Settings) {
  if (!s.smtp_host || !s.mail_from_email) throw new Error("SMTP belum diatur di halaman Pengaturan");
  return nodemailer.createTransport({
    host: s.smtp_host,
    port: s.smtp_port ?? 587,
    secure: !!s.smtp_secure,
    auth: s.smtp_user ? { user: s.smtp_user, pass: s.smtp_pass ?? "" } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

function from(s: Settings) {
  return s.mail_from_name ? { name: s.mail_from_name, address: s.mail_from_email! } : s.mail_from_email!;
}

export async function sendMail(to: string, subject: string, text: string, html: string, settings?: Settings) {
  const s = settings ?? (await getSettings());
  await transport(s).sendMail({ from: from(s), to, subject, text, html });
}

function toHtml(body: string, session: Session, sub: Submission) {
  const rows = session.fields
    .map(
      (f) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top">${escapeHtml(f.label)}</td><td style="padding:6px 0">${escapeHtml(formatFieldAnswer(f, sub.answers[f.key])) || "-"}</td></tr>`,
    )
    .join("");
  return `<div style="font-family:system-ui,Arial,sans-serif;font-size:15px;line-height:1.6;color:#111;max-width:560px">
${escapeHtml(body).replace(/\n/g, "<br>").replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')}
<hr style="border:none;border-top:1px solid #ddd;margin:24px 0">
<p style="margin:0 0 8px;font-weight:600">Ringkasan isian (${escapeHtml(sub.code)})</p>
<table style="border-collapse:collapse;font-size:14px">${rows}</table>
</div>`;
}

/** Kirim email konfirmasi dan catat hasilnya di tabel submissions. Tidak pernah melempar error. */
export async function sendConfirmation(session: Session, sub: Submission) {
  const db = createAdminClient();
  if (!session.email_enabled) {
    await db.from("submissions").update({ email_status: "skipped", email_error: null }).eq("id", sub.id);
    return { ok: true as const, skipped: true };
  }
  try {
    const vars = templateVars(session, sub);
    const subject = renderTemplate(session.email_subject, vars);
    const body = renderTemplate(session.email_body, vars);
    await sendMail(sub.email, subject, body, toHtml(body, session, sub));
    await db.from("submissions").update({ email_status: "sent", email_error: null }).eq("id", sub.id);
    return { ok: true as const };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db.from("submissions").update({ email_status: "failed", email_error: msg.slice(0, 500) }).eq("id", sub.id);
    return { ok: false as const, error: msg };
  }
}
