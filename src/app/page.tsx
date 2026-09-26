import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { sessionAvailability, type Session } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { Badge, Card, QuotaBar } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = createAdminClient();
  const { data } = await db.from("sessions").select("*").eq("status", "published").order("created_at", { ascending: false });
  const sessions = (data ?? []) as Session[];
  const { data: stats } = await db.from("session_stats").select("session_id, used").in("session_id", sessions.map((s) => s.id));
  const used = new Map((stats ?? []).map((r) => [r.session_id as string, Number(r.used)]));

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pendaftaran</h1>
          <p className="mt-1 text-gray-600">Pilih sesi yang tersedia. Kuota terbatas.</p>
        </div>
        <Link href="/cek" className="text-sm font-medium text-indigo-600 hover:underline">
          Cek ulang isian saya →
        </Link>
      </div>
      <div className="space-y-4">
        {sessions.length === 0 && <Card className="text-center text-gray-500">Belum ada sesi yang dibuka.</Card>}
        {sessions.map((s) => {
          const u = used.get(s.id) ?? 0;
          const av = sessionAvailability(s, u);
          return (
            <Link key={s.id} href={`/s/${s.slug}`} className="block">
              <Card className="transition hover:border-indigo-300 hover:shadow">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{s.title}</h2>
                    {s.closes_at && <p className="text-xs text-gray-500">Ditutup {fmtDate(s.closes_at)}</p>}
                  </div>
                  {av.open ? <Badge color="green">Sisa {av.remaining}</Badge> : <Badge color="red">{av.reason === "full" ? "Penuh" : "Tutup"}</Badge>}
                </div>
                <div className="mt-4">
                  <QuotaBar used={u} quota={s.quota} />
                  <p className="mt-1 text-xs text-gray-500">
                    {u} / {s.quota} terisi
                  </p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
