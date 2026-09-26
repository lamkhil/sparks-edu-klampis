import { z } from "zod";

/** Data materi promosi per sesi — semuanya opsional, diisi admin. */
export const promoSchema = z.object({
  poster_url: z.string().url().or(z.literal("")).optional(),
  subtitle: z.string().max(200).optional(),
  event_date: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/).optional(),
  event_time: z.string().max(60).optional(),
  age_range: z.string().max(60).optional(),
  location_name: z.string().max(120).optional(),
  location_address: z.string().max(300).optional(),
  maps_url: z.string().url().or(z.literal("")).optional(),
  price: z.string().max(30).optional(),
  price_unit: z.string().max(30).optional(),
  promo_price: z.string().max(30).optional(),
  promo_unit: z.string().max(30).optional(),
  promo_text: z.string().max(120).optional(),
  includes: z.array(z.string().trim().min(1).max(120)).max(30).optional(),
  partner: z.string().max(80).optional(),
  /** No. WhatsApp untuk konfirmasi pembayaran (tombol di halaman sukses & cek ulang). */
  whatsapp: z.string().regex(/^[0-9+ -]{0,20}$/, "Nomor WhatsApp tidak valid").optional(),
  /** Hanya untuk admin (mis. daftar pendamping, jadwal setor peserta). Tidak pernah ditampilkan publik. */
  internal_notes: z.string().max(5000).optional(),
});

export type Promo = z.infer<typeof promoSchema>;

export function fmtEventDate(d?: string) {
  if (!d) return "";
  return new Date(`${d}T00:00:00+07:00`).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** Link wa.me dengan pesan otomatis. Nomor 08xx diubah ke 628xx. */
export function whatsappLink(number: string | undefined, text: string) {
  const d = (number ?? "").replace(/\D/g, "");
  if (d.length < 8) return null;
  const intl = d.startsWith("0") ? `62${d.slice(1)}` : d;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}
