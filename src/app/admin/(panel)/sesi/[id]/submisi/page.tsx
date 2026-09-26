import { Download, Pencil, Search, Ticket, UserX, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPage, PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { countActive, getSessionById, slotUsage } from "@/lib/data";
import { fileFields, formatFieldAnswer, guestField, slotField } from "@/lib/form-schema";
import { fmtDate } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Submission } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RowActions } from "./row-actions";

export const metadata = { title: "Pendaftar" };

const FILTERS = [
  ["active", "Aktif"],
  ["cancelled", "Dibatalkan"],
  ["all", "Semua"],
] as const;

const PAY_FILTERS = [
  ["", "Semua pembayaran"],
  ["pending", "Menunggu"],
  ["paid", "Lunas"],
  ["rejected", "Ditolak"],
] as const;

export default async function SubmissionsPage({ params, searchParams }: PageProps<"/admin/sesi/[id]/submisi">) {
  const { id } = await params;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = sp.status === "cancelled" ? "cancelled" : sp.status === "all" ? "all" : "active";
  const slotFilter = typeof sp.slot === "string" ? sp.slot : "";
  const payFilter = typeof sp.pay === "string" && ["pending", "paid", "rejected"].includes(sp.pay) ? sp.pay : "";
  const session = await getSessionById(id);
  if (!session) notFound();

  const sf = slotField(session.fields);
  const gf = guestField(session.fields);
  const files = fileFields(session.fields);
  const hasPayment = session.track_payment || files.length > 0;

  const db = createAdminClient();
  let query = db.from("submissions").select("*").eq("session_id", id).order("created_at", { ascending: true });
  if (status !== "all") query = query.eq("status", status);
  if (slotFilter) query = query.eq("slot", slotFilter);
  if (payFilter) query = query.eq("payment_status", payFilter);
  if (q) {
    const safe = q.replace(/[%,()]/g, "");
    query = query.or(`code.ilike.%${safe}%,email.ilike.%${safe}%`);
  }
  const [{ data }, used, usage, { count: cancelled }, { count: pendingPay }] = await Promise.all([
    query.limit(1000),
    countActive(id),
    slotUsage(id),
    db.from("submissions").select("id", { count: "exact", head: true }).eq("session_id", id).eq("status", "cancelled"),
    db.from("submissions").select("id", { count: "exact", head: true }).eq("session_id", id).eq("status", "active").eq("payment_status", "pending"),
  ]);
  const subs = (data ?? []) as Submission[];

  // Link bukti transfer (bucket privat) berlaku 1 jam.
  const proofPaths = subs.flatMap((s) => files.map((f) => s.answers[f.key]).filter((p): p is string => typeof p === "string" && p !== ""));
  const proofUrls = new Map<string, string>();
  if (proofPaths.length) {
    const { data: signed } = await db.storage.from("payments").createSignedUrls(proofPaths, 3600);
    for (const s of signed ?? []) if (s.path && s.signedUrl) proofUrls.set(s.path, s.signedUrl);
  }

  const shown = session.fields.filter((f) => !["email", "slot", "guests", "file"].includes(f.type)).slice(0, 2);
  const totalGuests = Object.values(usage).reduce((a, u) => a + u.guests, 0);
  const href = (patch: Record<string, string>) => {
    const p = { ...(q ? { q } : {}), status, ...(slotFilter ? { slot: slotFilter } : {}), ...(payFilter ? { pay: payFilter } : {}), ...patch };
    return `?${new URLSearchParams(Object.fromEntries(Object.entries(p).filter(([, v]) => v !== "")))}`;
  };

  return (
    <AdminPage
      crumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Sesi & Form", href: "/admin/sesi" },
        { label: session.title, href: `/admin/sesi/${id}` },
        { label: "Pendaftar" },
      ]}
    >
      <PageHeader
        title="Pendaftar"
        description={session.title}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/admin/sesi/${id}`}>
                <Pencil /> Edit sesi
              </Link>
            </Button>
            <Button asChild>
              <a href={`/admin/sesi/${id}/export`}>
                <Download /> Export CSV
              </a>
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Terdaftar"
          value={`${used}/${session.quota}`}
          hint={`${session.quota ? Math.round((used / session.quota) * 100) : 0}% kuota terisi`}
          icon={Users}
        />
        <StatCard label={gf ? "Teman ikut" : "Sisa kursi"} value={gf ? totalGuests : Math.max(0, session.quota - used)} icon={Ticket} tone="sun" />
        {hasPayment ? (
          <StatCard label="Menunggu verifikasi" value={pendingPay ?? 0} hint="Bukti transfer belum dicek" icon={Wallet} tone={pendingPay ? "berry" : "ocean"} />
        ) : (
          <StatCard label="Sisa kursi" value={Math.max(0, session.quota - used)} icon={Ticket} tone="leaf" />
        )}
        <StatCard label="Dibatalkan" value={cancelled ?? 0} hint="Slot sudah dikembalikan" icon={UserX} tone="berry" />
      </div>

      {sf?.slots && (
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sf.slots.map((sl) => {
            const u = usage[sl.id] ?? { used: 0, guests: 0 };
            const pct = sl.quota ? Math.round((u.used / sl.quota) * 100) : 100;
            const active = slotFilter === sl.id;
            return (
              <Link key={sl.id} href={href({ slot: active ? "" : sl.id })}>
                <Card className={cn("transition hover:ring-brand-300", active && "ring-2 ring-brand-500")}>
                  <CardContent className="space-y-3">
                    <p className="font-semibold">{sl.label}</p>
                    <div>
                      <div className="mb-1.5 flex justify-between text-xs tabular-nums">
                        <span className="text-muted-foreground">Peserta</span>
                        <span>
                          <b>{u.used}</b>/{sl.quota}
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        className={"h-2 " + (pct >= 100 ? "[&>*]:bg-berry-500" : pct >= 80 ? "[&>*]:bg-tangerine-500" : "[&>*]:bg-brand-500")}
                      />
                    </div>
                    {sl.guest_quota > 0 && (
                      <div>
                        <div className="mb-1.5 flex justify-between text-xs tabular-nums">
                          <span className="text-muted-foreground">Teman</span>
                          <span>
                            <b>{u.guests}</b>/{sl.guest_quota}
                          </span>
                        </div>
                        <Progress value={sl.guest_quota ? (u.guests / sl.guest_quota) * 100 : 0} className="h-2 [&>*]:bg-sun-400" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <div className="inline-flex rounded-lg bg-muted p-1 text-sm">
            {FILTERS.map(([v, label]) => (
              <Link
                key={v}
                href={href({ status: v })}
                className={cn("rounded-md px-3 py-1 font-medium text-muted-foreground transition", status === v && "bg-background text-foreground shadow-sm")}
              >
                {label}
              </Link>
            ))}
          </div>
          {hasPayment && (
            <div className="inline-flex flex-wrap rounded-lg bg-muted p-1 text-sm">
              {PAY_FILTERS.map(([v, label]) => (
                <Link
                  key={v}
                  href={href({ pay: v })}
                  className={cn("rounded-md px-3 py-1 font-medium text-muted-foreground transition", payFilter === v && "bg-background text-foreground shadow-sm")}
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
          {slotFilter && sf && (
            <Link href={href({ slot: "" })} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
              {sf.slots?.find((s) => s.id === slotFilter)?.label ?? slotFilter} ✕
            </Link>
          )}
          <form className="relative ml-auto w-full sm:w-72">
            <input type="hidden" name="status" value={status} />
            {slotFilter && <input type="hidden" name="slot" value={slotFilter} />}
            {payFilter && <input type="hidden" name="pay" value={payFilter} />}
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Cari kode atau email, lalu Enter" className="pl-8" />
          </form>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10 pl-4">#</TableHead>
              <TableHead>Kode</TableHead>
              {shown.map((f) => (
                <TableHead key={f.id}>{f.label}</TableHead>
              ))}
              {sf && <TableHead>Jadwal</TableHead>}
              {gf && <TableHead className="text-center">Teman</TableHead>}
              {hasPayment && <TableHead>Pembayaran</TableHead>}
              <TableHead className="hidden xl:table-cell">Waktu daftar</TableHead>
              <TableHead className="hidden lg:table-cell">Email</TableHead>
              <TableHead className="w-12 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {subs.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="h-28 text-center text-muted-foreground">
                  {q || slotFilter || payFilter ? "Tidak ada pendaftar yang cocok." : "Belum ada pendaftar."}
                </TableCell>
              </TableRow>
            )}
            {subs.map((sub, i) => (
              <TableRow key={sub.id} className={sub.status === "cancelled" ? "text-muted-foreground" : ""}>
                <TableCell className="pl-4 tabular-nums text-muted-foreground">{i + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{sub.code}</span>
                    {sub.status === "cancelled" && <StatusBadge status="cancelled" />}
                  </div>
                </TableCell>
                {shown.map((f) => (
                  <TableCell key={f.id} className="max-w-48 truncate">
                    {formatFieldAnswer(f, sub.answers[f.key]) || "—"}
                  </TableCell>
                ))}
                {sf && <TableCell className="max-w-44 truncate">{formatFieldAnswer(sf, sub.slot)}</TableCell>}
                {gf && <TableCell className="text-center tabular-nums">{sub.guest_count || "—"}</TableCell>}
                {hasPayment && (
                  <TableCell>
                    <StatusBadge status={sub.payment_status === "none" ? "pending" : sub.payment_status} kind="payment" />
                  </TableCell>
                )}
                <TableCell className="hidden whitespace-nowrap text-sm xl:table-cell">{fmtDate(sub.created_at)}</TableCell>
                <TableCell className="hidden lg:table-cell" title={sub.email_error ?? sub.email ?? "Tanpa email"}>
                  <StatusBadge status={sub.email_status} />
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <RowActions
                    sub={sub}
                    fields={session.fields}
                    hasPayment={hasPayment}
                    proofs={files.map((f) => ({ label: f.label, url: proofUrls.get(String(sub.answers[f.key] ?? "")) ?? null }))}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </AdminPage>
  );
}
