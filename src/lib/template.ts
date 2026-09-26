import { appUrl } from "./env";
import type { FormField } from "./form-schema";
import { formatFieldAnswer } from "./form-schema";
import { amountBreakdown, computeAmount, DEFAULT_WA_TEMPLATE, fmtEventDate, formatRupiah, whatsappLink } from "./promo";
import type { Session, Submission } from "./types";

export { appUrl };

/** Placeholder bawaan yang selalu tersedia di pesan penutup, email & WhatsApp. */
export const BUILTIN_PLACEHOLDERS = {
  kode: "Kode pendaftaran",
  judul: "Judul sesi",
  email: "Email pendaftar",
  link_cek: "Link halaman cek ulang",
  tanggal: "Waktu mendaftar",
  total: "Total yang harus dibayar",
  rincian: "Rincian harga (pendaftar + teman)",
  ringkasan: "Semua jawaban pendaftar (per baris)",
  bank: "Nama bank",
  no_rekening: "Nomor rekening",
  atas_nama: "Nama pemilik rekening",
  tanggal_acara: "Tanggal acara",
  jam_acara: "Jam acara",
  lokasi: "Lokasi acara",
  link_wa: "Link WhatsApp konfirmasi (ke SA terpilih / contact center)",
} as const;

type SubLike = Pick<Submission, "code" | "email" | "answers" | "created_at"> & { guest_count?: number; amount?: number | null };

export function templateVars(session: Session, sub: SubLike) {
  const promo = session.promo ?? {};
  const guests = sub.guest_count ?? 0;
  const amount = sub.amount ?? computeAmount(promo, guests);
  const vars: Record<string, string> = {
    kode: sub.code,
    judul: session.title,
    email: sub.email ?? "",
    link_cek: `${appUrl()}/cek?kode=${encodeURIComponent(sub.code)}`,
    tanggal: new Date(sub.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long", timeStyle: "short" }),
    total: amount !== null ? formatRupiah(amount) : "",
    rincian: amount !== null ? amountBreakdown(promo, guests) : "",
    ringkasan: (session.fields as FormField[])
      .filter((f) => f.type !== "file")
      .map((f) => `${f.label}: ${formatFieldAnswer(f, sub.answers[f.key]) || "-"}`)
      .join("\n"),
    bank: promo.bank_name ?? "",
    no_rekening: promo.bank_account ?? "",
    atas_nama: promo.bank_holder ?? "",
    tanggal_acara: fmtEventDate(promo.event_date),
    jam_acara: promo.event_time ?? "",
    lokasi: [promo.location_name, promo.location_address].filter(Boolean).join(", "),
  };
  for (const f of session.fields as FormField[]) vars[f.key] = formatFieldAnswer(f, sub.answers[f.key]);
  // Link WA konfirmasi: nomor opsi yang dipilih (mis. Student Advisor), atau contact center.
  const waText = stripCopyMarks(renderTemplate(promo.wa_template?.trim() || DEFAULT_WA_TEMPLATE, vars));
  const optionWa = (session.fields as FormField[]).map((f) => f.option_wa?.[String(sub.answers[f.key] ?? "")]).find(Boolean);
  vars.link_wa = whatsappLink(optionWa || promo.whatsapp, waText) ?? "";
  return vars;
}

/** Ganti {{key}} dengan nilai; key yang tidak dikenal dibiarkan kosong. */
export function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, k: string) => vars[k.toLowerCase()] ?? "");
}

/** Penanda [[teks]] = teks yang bisa disalin di halaman. Untuk email/WhatsApp, kurungnya dibuang. */
export const COPY_MARK = /\[\[([^\]]+)\]\]/g;

export function stripCopyMarks(s: string) {
  return s.replace(COPY_MARK, "$1");
}

/** Pecah teks menjadi potongan biasa & potongan yang bisa disalin. */
export function splitCopyMarks(s: string) {
  return s.split(/(\[\[[^\]]+\]\])/).filter(Boolean).map((p) => (p.startsWith("[[") ? { copy: true, text: p.slice(2, -2) } : { copy: false, text: p }));
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Pesan WhatsApp konfirmasi pembayaran dari template sesi. */
export function paymentWhatsappText(session: Session, sub: SubLike) {
  const tpl = session.promo?.wa_template?.trim() || DEFAULT_WA_TEMPLATE;
  return stripCopyMarks(renderTemplate(tpl, templateVars(session, sub)));
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

/** Template pengingat yang bisa diatur per sesi (tab Pengingat). */
export interface Reminder {
  id: string;
  name: string;
  /** Teks pesan WhatsApp & isi email. */
  text: string;
  email_subject?: string;
}

export const DEFAULT_REMINDERS: Reminder[] = [
  {
    id: "bayar",
    name: "Pengingat pembayaran",
    email_subject: "Pengingat pembayaran {{judul}} ({{kode}})",
    text: `Halo, kami mengingatkan pembayaran pendaftaran {{judul}}.

Kode pendaftaran: {{kode}}
Total: {{total}}

Transfer ke:
{{bank}} {{no_rekening}}
a.n. {{atas_nama}}

Mohon kirim bukti transfer setelah membayar. Cek status pendaftaran: {{link_cek}}

Terima kasih.`,
  },
  {
    id: "hadir",
    name: "Pengingat kehadiran",
    email_subject: "Sampai jumpa di {{judul}}!",
    text: `Halo, sampai jumpa di {{judul}}!

Tanggal: {{tanggal_acara}}
Jam: {{jam_acara}}
Lokasi: {{lokasi}}
Kode pendaftaran: {{kode}}

Mohon datang 15 menit lebih awal. Detail pendaftaran: {{link_cek}}

Terima kasih.`,
  },
];

/** Nomor WhatsApp pendaftar: field No. HP wajib pertama, atau No. HP pertama yang terisi. */
export function registrantPhone(fields: FormField[], answers: Record<string, unknown>) {
  const phones = fields.filter((f) => f.type === "phone");
  const main = phones.find((f) => f.required) ?? phones[0];
  const v = main ? String(answers[main.key] ?? "") : "";
  return v || phones.map((f) => String(answers[f.key] ?? "")).find(Boolean) || "";
}
