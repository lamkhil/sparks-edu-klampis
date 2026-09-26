import type { FormField } from "./form-schema";
import { formatFieldAnswer } from "./form-schema";
import type { Session, Submission } from "./types";

export const BUILTIN_PLACEHOLDERS = {
  kode: "Kode submission",
  judul: "Judul sesi",
  email: "Email pengisi",
  link_cek: "Link halaman cek ulang",
  tanggal: "Waktu submit",
} as const;

export function appUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function templateVars(session: Session, sub: Pick<Submission, "code" | "email" | "answers" | "created_at">) {
  const vars: Record<string, string> = {
    kode: sub.code,
    judul: session.title,
    email: sub.email,
    link_cek: `${appUrl()}/cek?kode=${encodeURIComponent(sub.code)}`,
    tanggal: new Date(sub.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long", timeStyle: "short" }),
  };
  for (const f of session.fields as FormField[]) vars[f.key] = formatFieldAnswer(f, sub.answers[f.key]);
  return vars;
}

/** Ganti {{key}} dengan nilai; key yang tidak dikenal dibiarkan kosong. */
export function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, k: string) => vars[k.toLowerCase()] ?? "");
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
