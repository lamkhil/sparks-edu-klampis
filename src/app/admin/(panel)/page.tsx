import Link from "next/link";
import { Badge, Button, Card, QuotaBar } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Session } from "@/lib/types";
import { createSession } from "./sesi/actions";

export const metadata = { title: "Sesi" };

const STATUS = { draft: ["Draft", "gray"], published: ["Dibuka", "green"], closed: ["Ditutup", "red"] } as const;

export default async function AdminHome() {
  const db = createAdminClient();
  const { data } = await db.from("sessions").select("*").order("created_at", { ascending: false });
  const sessions = (data ?? []) as Session[];
  const { data: stats } = await db.from("session_stats").select("*");
  const byId = new Map((stats ?? []).map((r) => [r.session_id as string, { used: Number(r.used), cancelled: Number(r.cancelled) }]));

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sesi</h1>
        <form action={createSession}>
          <Button type="submit">+ Sesi baru</Button>
        </form>
      </div>
      {sessions.length === 0 ? (
        <Card className="text-center text-gray-500">Belum ada sesi. Klik “Sesi baru” untuk membuat form pertama.</Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Judul</th>
                <th className="px-4 py-3">Status</th>
                <th className="w-48 px-4 py-3">Kuota</th>
                <th className="px-4 py-3">Ditutup</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((s) => {
                const st = byId.get(s.id) ?? { used: 0, cancelled: 0 };
                const [label, color] = STATUS[s.status];
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/sesi/${s.id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                        {s.title}
                      </Link>
                      <div className="font-mono text-xs text-gray-500">/s/{s.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={color}>{label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <QuotaBar used={st.used} quota={s.quota} />
                      <div className="mt-1 text-xs text-gray-500">
                        {st.used} / {s.quota}
                        {st.cancelled > 0 && ` · ${st.cancelled} batal`}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{fmtDate(s.closes_at)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link href={`/admin/sesi/${s.id}/submisi`} className="mr-3 text-indigo-600 hover:underline">
                        Isian
                      </Link>
                      <Link href={`/admin/sesi/${s.id}`} className="text-indigo-600 hover:underline">
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
