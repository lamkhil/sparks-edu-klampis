import { Plus } from "lucide-react";
import { AdminPage, PageHeader } from "@/components/admin/page-header";
import { SessionsTable, type SessionRow } from "@/components/admin/sessions-table";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Session } from "@/lib/types";
import { createSession } from "./actions";

export const metadata = { title: "Sesi & Form" };

export default async function SessionsPage() {
  const db = createAdminClient();
  const [{ data }, { data: stats }] = await Promise.all([
    db.from("sessions").select("*").order("created_at", { ascending: false }),
    db.from("session_stats").select("*"),
  ]);
  const byId = new Map((stats ?? []).map((r) => [r.session_id as string, { used: Number(r.used), cancelled: Number(r.cancelled) }]));
  const rows: SessionRow[] = ((data ?? []) as Session[]).map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    status: s.status,
    quota: s.quota,
    eventDate: s.promo?.event_date ?? null,
    closesAt: s.closes_at,
    poster: s.promo?.poster_url || null,
    ...(byId.get(s.id) ?? { used: 0, cancelled: 0 }),
  }));

  return (
    <AdminPage crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Sesi & Form" }]}>
      <PageHeader
        title="Sesi & Form"
        description="Buat sesi, susun form pendaftaran, atur kuota dan materi promosi."
        actions={
          <form action={createSession}>
            <Button type="submit">
              <Plus /> Sesi baru
            </Button>
          </form>
        }
      />
      <SessionsTable rows={rows} />
    </AdminPage>
  );
}
