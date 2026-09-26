import Image from "next/image";
import Link from "next/link";
import { DotGrid, ShootingStar, Sparkle, Squiggle, Star } from "@/components/brand";
import { SessionCard } from "@/components/session-promo";
import { Card, buttonClass } from "@/components/kit";
import { fmtEventDate } from "@/lib/promo";
import { SITE } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { sessionAvailability, type Session, type SlotUsage } from "@/lib/types";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: "1", title: "Pilih sesi", text: "Lihat jadwal, lokasi, dan sisa kuota setiap Sparks Session." },
  { n: "2", title: "Isi formulir", text: "Lengkapi data peserta. Kursi langsung terkunci begitu formulir terkirim." },
  { n: "3", title: "Simpan kodenya", text: "Kode pendaftaran tampil di layar dan dikirim ke emailmu untuk cek ulang." },
];

export default async function Home() {
  const db = createAdminClient();
  const { data } = await db.from("sessions").select("*").eq("status", "published").order("created_at", { ascending: false });
  const all = (data ?? []) as Session[];
  const { data: stats } = await db.from("session_stats").select("session_id, used").in("session_id", all.map((s) => s.id));
  const used = new Map((stats ?? []).map((r) => [r.session_id as string, Number(r.used)]));
  // Pemakaian kuota per jadwal untuk setiap sesi.
  const { data: slotRows } = await db
    .from("submissions")
    .select("session_id, slot, guest_count")
    .in("session_id", all.map((s) => s.id))
    .eq("status", "active")
    .not("slot", "is", null);
  const usage = new Map<string, SlotUsage>();
  for (const r of slotRows ?? []) {
    const m = usage.get(r.session_id) ?? {};
    const u = (m[r.slot as string] ??= { used: 0, guests: 0 });
    u.used += 1;
    u.guests += Number(r.guest_count) || 0;
    usage.set(r.session_id, m);
  }

  // Sesi yang masih bisa didaftar di depan, diurutkan berdasarkan tanggal acara terdekat.
  const sessions = all
    .map((s) => ({ s, u: used.get(s.id) ?? 0, open: sessionAvailability(s, used.get(s.id) ?? 0).open }))
    .sort((a, b) => Number(b.open) - Number(a.open) || (a.s.promo?.event_date ?? "9999").localeCompare(b.s.promo?.event_date ?? "9999"));
  const [featured, ...rest] = sessions;
  const next = sessions.find((x) => x.open);

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <DotGrid className="-right-10 top-10 h-64 w-64 opacity-60" />
        <div className="absolute -left-24 top-32 h-72 w-72 rounded-full bg-sun-200/50 blur-3xl" aria-hidden />
        <div className="absolute -bottom-20 right-1/3 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" aria-hidden />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 md:grid-cols-[1.1fr_0.9fr] md:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 ring-1 ring-brand-200">
              <Star className="h-3.5 w-3.5" /> {SITE.brand} {SITE.branch} presents
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              {SITE.heroTitle[0]}{" "}
              <span className="relative inline-block text-brand-600">
                {SITE.heroTitle[1]}
                <Squiggle className="absolute -bottom-2 left-0 h-3 w-full text-sun-400" />
              </span>{" "}
              {SITE.heroTitle[2]}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">{SITE.heroText}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#sesi" className={buttonClass("primary", "px-7 py-3.5 text-base")}>
                Lihat sesi & daftar
              </Link>
              <Link href="/cek" className={buttonClass("secondary", "px-7 py-3.5 text-base")}>
                Cek pendaftaran
              </Link>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {SITE.highlights.map((h) => (
                <div key={h.title} className="rounded-2xl bg-white/70 p-3 ring-1 ring-line">
                  <dt className="text-sm font-bold text-ink">{h.title}</dt>
                  <dd className="mt-0.5 hidden text-xs text-muted-foreground sm:block">{h.text}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-sm md:max-w-none">
            <ShootingStar className="absolute -left-10 -top-10 z-10 h-24 w-24 animate-twinkle" />
            <Sparkle className="absolute -right-3 top-16 z-10 h-6 w-6 text-leaf-500" />
            <Sparkle className="absolute -left-4 bottom-24 z-10 h-4 w-4 text-ocean-500" />
            <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-leaf bg-sun-400" aria-hidden />
            <div className="relative overflow-hidden rounded-leaf border-4 border-white shadow-xl">
              {next?.s.promo?.poster_url ? (
                <Image src={next.s.promo.poster_url} alt={`Poster ${next.s.title}`} width={800} height={1000} priority className="aspect-[4/5] w-full object-cover" />
              ) : (
                <Image src="/brand/klampis-facade.webp" alt="Gedung Sparks English Klampis" width={768} height={1056} priority className="aspect-[4/5] w-full object-cover" />
              )}
            </div>
            {next && (
              <Link
                href={`/s/${next.s.slug}`}
                className="absolute -bottom-6 -left-4 right-8 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-line transition hover:ring-brand-300 sm:-left-8"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Sesi berikutnya</p>
                <p className="mt-0.5 truncate font-bold text-ink">{next.s.title}</p>
                <p className="text-sm text-muted-foreground">
                  {next.s.promo?.event_date ? fmtEventDate(next.s.promo.event_date) : "Jadwal segera diumumkan"} ·{" "}
                  <span className="font-semibold text-berry-500">sisa {Math.max(0, next.s.quota - next.u)} kursi</span>
                </p>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* DAFTAR SESI */}
      <section id="sesi" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-leaf-500">{SITE.eventName}</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Sesi yang bisa kamu ikuti</h2>
            <p className="mt-3 text-muted-foreground">Kuota tiap sesi terbatas dan dihitung otomatis. Begitu penuh, pendaftaran langsung ditutup.</p>
          </div>

          {!featured ? (
            <Card className="relative overflow-hidden text-center">
              <ShootingStar className="mx-auto h-20 w-20" />
              <p className="mt-4 text-lg font-bold text-ink">Belum ada sesi yang dibuka</p>
              <p className="mt-1 text-muted-foreground">Pantau terus halaman ini, sesi baru segera hadir!</p>
            </Card>
          ) : (
            <div className="space-y-8">
              <SessionCard session={featured.s} used={featured.u} usage={usage.get(featured.s.id)} featured />
              {rest.length > 0 && (
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map(({ s, u }) => (
                    <SessionCard key={s.id} session={s} used={u} usage={usage.get(s.id)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CARA DAFTAR */}
      <section id="cara-daftar" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Cara daftar</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative rounded-leaf bg-white p-7 ring-1 ring-line">
                <span
                  className={`grid h-12 w-12 place-items-center rounded-full text-xl font-extrabold ${["bg-brand-600 text-white", "bg-sun-400 text-ink", "bg-leaf-500 text-white"][i]}`}
                >
                  {s.n}
                </span>
                <h3 className="mt-5 text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA CEK */}
      <section className="px-4">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-leaf-alt bg-sun-400 px-8 py-12 sm:px-14">
          <ShootingStar className="absolute -right-4 -top-4 h-32 w-32 opacity-40 [&_*]:!fill-white [&_*]:!stroke-white" />
          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">Sudah mendaftar?</h2>
              <p className="mt-2 max-w-lg text-ink/80">Masukkan kode pendaftaran dan email untuk melihat, mengubah, atau membatalkan pendaftaranmu.</p>
            </div>
            <Link href="/cek" className={buttonClass("primary", "px-7 py-3.5 text-base")}>
              Cek pendaftaran →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
