import { requireAdmin } from "@/lib/auth";
import { getSessionById } from "@/lib/data";
import { formatAnswer } from "@/lib/form-schema";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Submission } from "@/lib/types";

function csvCell(v: string) {
  // Cegah formula injection di Excel/Sheets
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export async function GET(_: Request, ctx: RouteContext<"/admin/sesi/[id]/export">) {
  await requireAdmin();
  const { id } = await ctx.params;
  const session = await getSessionById(id);
  if (!session) return new Response("Not found", { status: 404 });
  const { data } = await createAdminClient().from("submissions").select("*").eq("session_id", id).order("created_at");
  const subs = (data ?? []) as Submission[];

  const header = ["Kode", "Status", "Waktu", "Status email", ...session.fields.map((f) => f.label)];
  const rows = subs.map((s) => [s.code, s.status, s.created_at, s.email_status, ...session.fields.map((f) => formatAnswer(s.answers[f.key]))]);
  const csv = "﻿" + [header, ...rows].map((r) => r.map((c) => csvCell(String(c))).join(",")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${session.slug}.csv"`,
    },
  });
}
