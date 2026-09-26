// Konfigurasi dari environment. Nama cadangan mendukung variabel yang dibuat
// otomatis oleh integrasi Supabase di Vercel (SUPABASE_URL, SUPABASE_SECRET_KEY, dll).
// Catatan: variabel NEXT_PUBLIC_* ditulis literal agar bisa di-inline ke browser.

const clean = (v: string | undefined) => v?.trim().replace(/^["']|["']$/g, "") || undefined;

// Nilai kosong ("") dianggap tidak diset, sehingga cadangan tetap dipakai.
export const SUPABASE_URL = (clean(process.env.NEXT_PUBLIC_SUPABASE_URL) || clean(process.env.SUPABASE_URL))!;

export const SUPABASE_PUBLIC_KEY = (clean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  clean(process.env.SUPABASE_PUBLISHABLE_KEY) ||
  clean(process.env.SUPABASE_ANON_KEY))!;

/** Hanya server. */
export function supabaseServiceKey() {
  const k = clean(process.env.SUPABASE_SERVICE_ROLE_KEY) || clean(process.env.SUPABASE_SECRET_KEY);
  if (!k) throw new Error("SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY belum diset");
  return k;
}

/** Hanya server: kunci untuk menandatangani cookie cek ulang. */
export function appSecret() {
  const s = clean(process.env.APP_SECRET) || clean(process.env.SUPABASE_JWT_SECRET) || clean(process.env.SUPABASE_SERVICE_ROLE_KEY) || clean(process.env.SUPABASE_SECRET_KEY);
  if (!s) throw new Error("APP_SECRET belum diset");
  return s;
}

/** URL publik aplikasi (untuk link di email). */
export function appUrl() {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return (clean(process.env.APP_URL) || (vercel ? `https://${vercel}` : "http://localhost:3000")).replace(/\/$/, "");
}
