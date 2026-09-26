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
  /** Harga per pendaftar (Rupiah) — dipakai menghitung total. */
  fee: z.coerce.number().int().min(0).max(100_000_000).optional(),
  /** Harga per teman yang diajak (Rupiah). Kosong = sama dengan harga pendaftar. */
  guest_fee: z.coerce.number().int().min(0).max(100_000_000).optional(),
  /** Teks harga di label bintang (kosong = otomatis dari harga, mis. "75K"). */
  price: z.string().max(30).optional(),
  /** Kata kecil di atas harga pada label bintang, mis. "hanya". */
  price_prefix: z.string().max(20).optional(),
  /** Judul pita daftar yang didapat. */
  includes_title: z.string().max(60).optional(),
  /** Template pesan WhatsApp konfirmasi pembayaran (boleh pakai placeholder). */
  wa_template: z.string().max(2000).optional(),
  price_unit: z.string().max(30).optional(),
  promo_price: z.string().max(30).optional(),
  promo_unit: z.string().max(30).optional(),
  promo_text: z.string().max(120).optional(),
  includes: z.array(z.string().trim().min(1).max(120)).max(30).optional(),
  partner: z.string().max(80).optional(),
  /** Rekening pembayaran (ditampilkan di kartu Pembayaran, bukan di teks penutup). */
  bank_name: z.string().max(60).optional(),
  bank_account: z.string().regex(/^[0-9 .-]{0,40}$/, "No. rekening hanya boleh angka").optional(),
  bank_holder: z.string().max(80).optional(),
  /** No. WhatsApp contact center (tombol di halaman sukses & cek ulang). */
  whatsapp: z.string().regex(/^[0-9+ -]{0,20}$/, "Nomor WhatsApp tidak valid").optional(),
  /** Label tombol contact center. */
  whatsapp_label: z.string().max(60).optional(),
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

export const DEFAULT_WA_TEMPLATE = `Halo, saya ingin konfirmasi pembayaran {{judul}}.

Kode pendaftaran: {{kode}}
{{ringkasan}}

Total: {{total}}

Berikut saya lampirkan bukti transfernya. Terima kasih.`;

export function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

/** "75000" → "75K", "1250000" → "1,25jt" untuk label harga singkat. */
export function shortPrice(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })}jt`;
  if (n >= 1000) return `${(n / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}K`;
  return String(n);
}

/** Teks harga untuk label: pakai teks manual, atau otomatis dari angka harga. */
export function priceLabel(p: Promo) {
  return p.price?.trim() || (p.fee ? shortPrice(p.fee) : "");
}

/** Hitung total bayar: harga pendaftar + jumlah teman × harga teman. Null jika sesi tidak berbayar. */
export function computeAmount(p: Promo, guests: number) {
  if (!p.fee && !p.guest_fee) return null;
  const fee = p.fee ?? 0;
  const guestFee = p.guest_fee ?? fee;
  return fee + Math.max(0, guests) * guestFee;
}

/** "1 pendaftar × Rp 75.000 + 1 teman × Rp 60.000" */
export function amountBreakdown(p: Promo, guests: number) {
  const fee = p.fee ?? 0;
  const guestFee = p.guest_fee ?? fee;
  const parts = [`1 pendaftar × ${formatRupiah(fee)}`];
  if (guests > 0) parts.push(`${guests} teman × ${formatRupiah(guestFee)}`);
  return parts.join(" + ");
}
