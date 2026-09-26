import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, QuotaBar, buttonClass } from "@/components/ui";
import { countActive, getSessionById } from "@/lib/data";
import { formatAnswer } from "@/lib/form-schema";
import { fmtDate } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Submission } from "@/lib/types";
import { RowActions } from "./row-actions";

export const metadata = { title: "Isian" };

const EMAIL_BADGE = { sent: ["terkirim", "green"], failed: ["gagal", "red"], pending: ["menunggu", "yellow"], skipped: ["-", "gray"] } as const;

export default async function SubmissionsPage({ params, searchParams }: PageProps<"/admin/sesi/[id]/submisi">) {
  const { id } = await params;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = sp.status === "cancelled" ? "cancelled" : sp.status === "all" ? "all" : "active";
  const session = await getSessionById(id);
  if (!session) notFound();

  let query = createAdminClient().from("submissions").select("*").eq("session_id", id).order("created_at", { ascending: true });
  if (status !== "all") query = query.eq("status", status);
  if (q) query = query.or(`code.ilike.%${q.replace(/[%,()]/g, "")}%,email.ilike.%${q.replace(/[%,()]/g, "")}%`);
  const { data } = await query.limit(1000);
  const subs = (data ?? []) as Submission[];
  const used = await countActive(id);
  const shown = session.fields.slice(0, 4);

  return (
    <>
      <div className="mb-2 text-sm">
        <Link href={`/admin/sesi/${id}`} className="text-gray-600 hover:underline">
          ← {session.title}
        </Link>
      </div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold">Isian</h1>
        <a href={`/admin/sesi/${id}/export`} className={buttonClass("secondary")}>
          Export CSV
        </a>
      </div>

      <Card className="mb-6">
        <div className="mb-2 flex justify-between text-sm">
          <span>
            <b>{used}</b> / {session.quota} terisi
          </span>
          <span className="text-gray-600">Sisa {Math.max(0, session.quota - used)}</span>
        </div>
        <QuotaBar used={used} quota={session.quota} />
      </Card>

      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Cari kode / email" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
        <select name="status" defaultValue={status} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
          <option value="active">Aktif</option>
          <option value="cancelled">Dibatalkan</option>
          <option value="all">Semua</option>
        </select>
        <button className={buttonClass("secondary")}>Filter</button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-3">#</th>
              <th className="px-3 py-3">Kode</th>
              {shown.map((f) => (
                <th key={f.id} className="px-3 py-3">
                  {f.label}
                </th>
              ))}
              <th className="px-3 py-3">Waktu</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subs.length === 0 && (
              <tr>
                <td colSpan={shown.length + 5} className="px-3 py-8 text-center text-gray-500">
                  Belum ada isian.
                </td>
              </tr>
            )}
            {subs.map((sub, i) => {
              const [label, color] = EMAIL_BADGE[sub.email_status];
              return (
                <tr key={sub.id} className={sub.status === "cancelled" ? "bg-gray-50 text-gray-400" : ""}>
                  <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono">
                    {sub.code}
                    {sub.status === "cancelled" && (
                      <span className="ml-2">
                        <Badge color="red">batal</Badge>
                      </span>
                    )}
                  </td>
                  {shown.map((f) => (
                    <td key={f.id} className="max-w-48 truncate px-3 py-2">
                      {formatAnswer(sub.answers[f.key])}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-2 text-xs">{fmtDate(sub.created_at)}</td>
                  <td className="px-3 py-2" title={sub.email_error ?? ""}>
                    <Badge color={color}>{label}</Badge>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <RowActions sub={sub} fields={session.fields} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
