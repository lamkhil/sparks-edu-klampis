import { AlertTriangle, ArrowRight, CalendarDays, Plus, Ticket, Users } from "lucide-react";
import Link from "next/link";
import { AdminPage, PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fmtDate } from "@/lib/format";
import { fmtEventDate } from "@/lib/promo";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Session, Submission } from "@/lib/types";
import { createSession } from "./sesi/actions";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const db = createAdminClient();
  const [{ data: sData }, { data: stats }, { data: recentData }, { count: failed }] = await Promise.all([
    db.from("sessions").select("*").order("created_at", { ascending: false }),
    db.from("session_stats").select("*"),
    db.from("submissions").select("*, session:sessions(title)").eq("status", "active").order("created_at", { ascending: false }).limit(8),
    db.from("submissions").select("id", { count: "exact", head: true }).eq("email_status", "failed").eq("status", "active"),
  ]);
  const sessions = (sData ?? []) as Session[];
  const used = new Map((stats ?? []).map((r) => [r.session_id as string, Number(r.used)]));
  const published = sessions.filter((s) => s.status === "published");
  const totalActive = [...used.values()].reduce((a, b) => a + b, 0);
  const remaining = published.reduce((a, s) => a + Math.max(0, s.quota - (used.get(s.id) ?? 0)), 0);
  const recent = (recentData ?? []) as (Submission & { session: { title: string } | null })[];

  return (
    <AdminPage crumbs={[{ label: "Dashboard" }]}>
      <PageHeader
        title="Dashboard"
        description="Ringkasan pendaftaran Sparks Session."
        actions={
          <form action={createSession}>
            <Button type="submit">
              <Plus /> Sesi baru
            </Button>
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sesi dibuka" value={published.length} hint={`${sessions.length} sesi total`} icon={CalendarDays} />
        <StatCard label="Total pendaftar" value={totalActive} hint="Pendaftaran aktif" icon={Users} tone="leaf" />
        <StatCard label="Sisa kuota" value={remaining} hint="Dari semua sesi yang dibuka" icon={Ticket} tone="sun" />
        <StatCard label="Email gagal" value={failed ?? 0} hint="Perlu kirim ulang" icon={AlertTriangle} tone={failed ? "berry" : "ocean"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Kuota sesi yang dibuka</CardTitle>
            <CardDescription>Progres pengisian tiap sesi.</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/sesi">
                  Semua sesi <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-5">
            {published.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Belum ada sesi yang dibuka.</p>}
            {published.map((s) => {
              const u = used.get(s.id) ?? 0;
              const pct = s.quota ? Math.round((u / s.quota) * 100) : 100;
              return (
                <Link key={s.id} href={`/admin/sesi/${s.id}/submisi`} className="block rounded-lg p-2 -m-2 hover:bg-muted/60">
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.promo?.event_date ? fmtEventDate(s.promo.event_date) : "Tanggal belum diatur"}</p>
                    </div>
                    <p className="shrink-0 text-sm tabular-nums">
                      <span className="font-semibold">{u}</span>
                      <span className="text-muted-foreground">/{s.quota}</span>
                    </p>
                  </div>
                  <Progress value={pct} className={"h-2 " + (pct >= 100 ? "[&>*]:bg-berry-500" : pct >= 80 ? "[&>*]:bg-tangerine-500" : "[&>*]:bg-brand-500")} />
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Pendaftar terbaru</CardTitle>
            <CardDescription>8 pendaftaran terakhir.</CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Belum ada pendaftar.</p>}
            <ul className="divide-y">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.email}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.session?.title} · {fmtDate(r.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{r.code}</span>
                    {r.email_status === "failed" && <StatusBadge status="failed" />}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}
