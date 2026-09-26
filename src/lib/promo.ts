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
  /** Harga per orang (Rupiah) — dipakai menghitung total. */
  fee: z.coerce.number().int().min(0).max(100_000_000).optional(),
  /** Harga rombongan: mulai `people` orang (pendaftar + teman), harga per orang menjadi `fee`. */
  group_prices: z
    .array(z.object({ people: z.coerce.number().int().min(2).max(50), fee: z.coerce.number().int().min(0).max(100_000_000) }))
    .max(10)
    .optional(),
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

/** Harga per orang untuk jumlah peserta tertentu (tingkat rombongan terbesar yang terpenuhi). */
export function feePerPerson(p: Promo, people: number) {
  const tier = (p.group_prices ?? []).filter((t) => people >= t.people).sort((a, b) => b.people - a.people)[0];
  return tier ? tier.fee : (p.fee ?? 0);
}

/** Total bayar = jumlah orang (pendaftar + teman) × harga per orang. Null jika sesi tidak berbayar. */
export function computeAmount(p: Promo, guests: number) {
  if (!p.fee) return null;
  const people = 1 + Math.max(0, guests);
  return people * feePerPerson(p, people);
}

/** Nama satuan peserta dari "Satuan" harga, mis. "/anak" → "anak". */
export function unitName(p: Promo) {
  return (p.price_unit ?? "").replace(/^[\s/]+/, "").trim() || "peserta";
}

/** Harga normal (tanpa harga rombongan), total, & harga per orang. */
export function priceSummary(p: Promo, guests: number) {
  const total = computeAmount(p, guests);
  if (total === null) return null;
  const people = 1 + Math.max(0, guests);
  const per = feePerPerson(p, people);
  const normal = people * (p.fee ?? 0);
  return { total, normal, per, people, saving: Math.max(0, normal - total), unit: unitName(p) };
}

/** "2 anak × Rp 70.000" */
export function amountBreakdown(p: Promo, guests: number) {
  const s = priceSummary(p, guests);
  if (!s) return "";
  return `${s.people} ${s.unit} × ${formatRupiah(s.per)}`;
}
