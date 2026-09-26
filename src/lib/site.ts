import { z } from "zod";

const item = z.object({ title: z.string().trim().max(80), text: z.string().trim().max(300) });

/** Isi & tampilan situs publik yang bisa diatur admin (Admin → Tampilan Situs). */
export const siteSchema = z.object({
  brand: z.string().trim().max(60),
  branch: z.string().trim().max(60),
  event_name: z.string().trim().max(80),
  tagline: z.string().trim().max(300),
  logo_url: z.string().max(500),
  og_image_url: z.string().max(500),
  hero_badge: z.string().trim().max(80),
  /** Bagian di antara *bintang* diberi warna & garis bawah. */
  hero_title: z.string().trim().max(160),
  hero_text: z.string().trim().max(600),
  hero_image_url: z.string().max(500),
  hero_cta: z.string().trim().max(40),
  highlights: z.array(item).max(6),
  sessions_eyebrow: z.string().trim().max(60),
  sessions_title: z.string().trim().max(120),
  sessions_text: z.string().trim().max(400),
  empty_title: z.string().trim().max(120),
  empty_text: z.string().trim().max(300),
  steps_title: z.string().trim().max(80),
  steps: z.array(item).max(6),
  cta_title: z.string().trim().max(120),
  cta_text: z.string().trim().max(300),
  cta_button: z.string().trim().max(40),
  address: z.string().trim().max(300),
  maps_url: z.string().trim().max(500),
  website_url: z.string().trim().max(500),
  website_label: z.string().trim().max(60),
});

export type SiteSettings = z.infer<typeof siteSchema>;

/** Nilai awal (dipakai hanya jika pengaturan di database masih kosong). */
export const DEFAULT_SITE: SiteSettings = {
  brand: "Sparks English",
  branch: "Klampis",
  event_name: "Sparks Session",
  tagline: "Daftar Sparks Session di Sparks English Klampis — kuota terbatas, amankan kursimu sekarang.",
  logo_url: "/brand/sparks-english-logo.png",
  og_image_url: "/brand/og.png",
  hero_badge: "Sparks English Klampis presents",
  hero_title: "Ikuti *Sparks Session* di Klampis!",
  hero_text:
    "Sesi seru belajar bahasa Inggris untuk anak usia 3–15 tahun bersama guru native & bersertifikat Cambridge TKT. Pilih sesi, isi formulir, dan simpan kode pendaftaranmu.",
  hero_image_url: "/brand/klampis-facade.webp",
  hero_cta: "Lihat sesi & daftar",
  highlights: [
    { title: "Usia 3–15 tahun", text: "Program sesuai jenjang, dari Little Sparks sampai remaja." },
    { title: "Kurikulum CEFR", text: "Terstruktur, terukur, dan menyenangkan." },
    { title: "Guru native & TKT", text: "Pengajar berpengalaman dan bersertifikat." },
  ],
  sessions_eyebrow: "Sparks Session",
  sessions_title: "Sesi yang bisa kamu ikuti",
  sessions_text: "Kuota tiap sesi terbatas dan dihitung otomatis. Begitu penuh, pendaftaran langsung ditutup.",
  empty_title: "Belum ada sesi yang dibuka",
  empty_text: "Pantau terus halaman ini, sesi baru segera hadir!",
  steps_title: "Cara daftar",
  steps: [
    { title: "Pilih sesi", text: "Lihat jadwal, lokasi, dan sisa kuota setiap Sparks Session." },
    { title: "Isi formulir", text: "Lengkapi data peserta. Kursi langsung terkunci begitu formulir terkirim." },
    { title: "Simpan kodenya", text: "Kode pendaftaran tampil di layar untuk cek ulang pendaftaran." },
  ],
  cta_title: "Sudah mendaftar?",
  cta_text: "Masukkan kode pendaftaran dan No. HP untuk melihat, mengubah, atau membatalkan pendaftaranmu.",
  cta_button: "Cek pendaftaran",
  address: "Jl. Klampis Jaya, Klampis Ngasem, Kec. Sukolilo, Surabaya, Jawa Timur 60117",
  maps_url: "https://maps.google.com/?q=Sparks+English+Klampis+Surabaya",
  website_url: "https://sparks-edu.com/location/surabaya/",
  website_label: "sparks-edu.com",
};

/** Gabungkan data tersimpan dengan nilai awal (kolom kosong memakai nilai awal). */
export function mergeSite(raw: unknown): SiteSettings {
  const out = { ...DEFAULT_SITE };
  if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (!(k in out)) continue;
      if (typeof v === "string" && v.trim() !== "") (out as Record<string, unknown>)[k] = v;
      if (Array.isArray(v)) (out as Record<string, unknown>)[k] = v;
    }
  }
  return out;
}

/** "Ikuti *Sparks Session* di Klampis!" → potongan teks biasa & sorotan. */
export function splitHighlight(title: string) {
  return title.split(/(\*[^*]+\*)/).filter(Boolean).map((p) => (p.startsWith("*") && p.endsWith("*") ? { hl: true, text: p.slice(1, -1) } : { hl: false, text: p }));
}
