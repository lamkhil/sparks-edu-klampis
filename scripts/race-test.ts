/**
 * Uji kuota saat banyak orang submit bersamaan.
 * Jalankan: npx tsx --env-file=.env.local scripts/race-test.ts
 * Membuat sesi sementara berkuota 10, mengirim 50 submit paralel, lalu menghapus sesi tersebut.
 */
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function main() {
  const { data: s, error } = await db
    .from("sessions")
    .insert({ slug: `race-${Date.now()}`, title: "Race test", status: "published", quota: 10, email_enabled: false })
    .select("id")
    .single();
  if (error) throw error;
  try {
    const results = await Promise.all(
      Array.from({ length: 50 }, (_, i) => db.rpc("submit_form", { p_session_id: s.id, p_email: `race${i}@example.com`, p_answers: {} })),
    );
    const ok = results.filter((r) => !r.error).length;
    const full = results.filter((r) => r.error?.message.includes("QUOTA_FULL")).length;
    console.log(`berhasil: ${ok}, ditolak kuota penuh: ${full}, error lain: ${50 - ok - full}`);
    console.log(ok === 10 ? "✅ LULUS" : "❌ GAGAL");
    process.exitCode = ok === 10 ? 0 : 1;
  } finally {
    await db.from("sessions").delete().eq("id", s.id);
  }
}

main();
