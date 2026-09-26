import "server-only";
import { viewToken } from "./access";
import type { FormField } from "./form-schema";
import { DEFAULT_WA_TEMPLATE, whatsappLink } from "./promo";
import { appUrl, renderTemplate, stripCopyMarks, templateVars } from "./template";
import type { Session, Submission } from "./types";

type SubLike = Pick<Submission, "code" | "email" | "answers" | "created_at"> & { guest_count?: number; amount?: number | null };

/** Link pribadi: langsung membuka isian pendaftar tanpa mengetik No. HP/email. */
export function privateLink(code: string) {
  return `${appUrl()}/r/${encodeURIComponent(code)}?t=${viewToken(code)}`;
}

/** Placeholder lengkap untuk server: {{link_cek}} = link pribadi. */
export function fullTemplateVars(session: Session, sub: SubLike) {
  return templateVars(session, sub, { link_cek: privateLink(sub.code) });
}

/** Pesan WhatsApp konfirmasi pembayaran dari template sesi. */
export function paymentWhatsappText(session: Session, sub: SubLike) {
  const tpl = session.promo?.wa_template?.trim() || DEFAULT_WA_TEMPLATE;
  return stripCopyMarks(renderTemplate(tpl, fullTemplateVars(session, sub)));
}

/** Tujuan WhatsApp konfirmasi: nomor dari opsi yang dipilih (mis. Student Advisor), lalu contact center. */
export function whatsappTargets(session: Session, sub: SubLike) {
  const text = paymentWhatsappText(session, sub);
  const out: { label: string; href: string }[] = [];
  for (const f of session.fields as FormField[]) {
    if (!f.option_wa) continue;
    const choice = String(sub.answers[f.key] ?? "");
    const href = whatsappLink(f.option_wa[choice], text);
    if (href) out.push({ label: `Konfirmasi ke ${choice} via WhatsApp`, href });
  }
  const cc = whatsappLink(session.promo?.whatsapp, text);
  if (cc) out.push({ label: session.promo?.whatsapp_label?.trim() || "Hubungi Contact Center via WhatsApp", href: cc });
  return out;
}
