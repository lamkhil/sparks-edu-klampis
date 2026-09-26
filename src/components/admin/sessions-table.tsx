"use client";

import { Copy, ExternalLink, ImageIcon, MoreHorizontal, Pencil, Search, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtDate } from "@/lib/format";
import { fmtEventDate } from "@/lib/promo";
import type { SessionStatus } from "@/lib/types";

export type SessionRow = {
  id: string;
  title: string;
  slug: string;
  status: SessionStatus;
  quota: number;
  used: number;
  cancelled: number;
  eventDate: string | null;
  closesAt: string | null;
  poster: string | null;
};

export function SessionsTable({ rows }: { rows: SessionRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | SessionStatus>("all");
  const filtered = useMemo(
    () => rows.filter((r) => (status === "all" || r.status === status) && `${r.title} ${r.slug}`.toLowerCase().includes(q.toLowerCase())),
    [rows, q, status],
  );
  const count = (s: SessionStatus) => rows.filter((r) => r.status === s).length;

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/s/${slug}`);
    toast.success("Link form disalin");
  };

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <TabsList>
            <TabsTrigger value="all">Semua ({rows.length})</TabsTrigger>
            <TabsTrigger value="published">Dibuka ({count("published")})</TabsTrigger>
            <TabsTrigger value="draft">Draft ({count("draft")})</TabsTrigger>
            <TabsTrigger value="closed">Ditutup ({count("closed")})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari sesi…" className="pl-8" />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="pl-4">Sesi</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-52">Kuota</TableHead>
            <TableHead className="hidden md:table-cell">Tanggal acara</TableHead>
            <TableHead className="hidden lg:table-cell">Pendaftaran ditutup</TableHead>
            <TableHead className="w-12 pr-4" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                {rows.length === 0 ? "Belum ada sesi. Klik “Sesi baru” untuk mulai." : "Tidak ada sesi yang cocok."}
              </TableCell>
            </TableRow>
          )}
          {filtered.map((r) => {
            const pct = r.quota ? Math.round((r.used / r.quota) * 100) : 100;
            return (
              <TableRow key={r.id}>
                <TableCell className="pl-4">
                  <Link href={`/admin/sesi/${r.id}`} className="flex items-center gap-3">
                    <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-sun-100 text-sun-700">
                      {r.poster ? <Image src={r.poster} alt="" fill sizes="44px" className="object-cover" /> : <ImageIcon className="size-4" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium hover:text-brand-700">{r.title}</span>
                      <span className="block truncate font-mono text-xs text-muted-foreground">/s/{r.slug}</span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell>
                  <div className="mb-1.5 flex justify-between text-xs tabular-nums">
                    <span>
                      <b>{r.used}</b>
                      <span className="text-muted-foreground">/{r.quota}</span>
                    </span>
                    {r.cancelled > 0 && <span className="text-muted-foreground">{r.cancelled} batal</span>}
                  </div>
                  <Progress value={pct} className={"h-2 " + (pct >= 100 ? "[&>*]:bg-berry-500" : pct >= 80 ? "[&>*]:bg-tangerine-500" : "[&>*]:bg-brand-500")} />
                </TableCell>
                <TableCell className="hidden text-sm md:table-cell">{r.eventDate ? fmtEventDate(r.eventDate) : <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{r.closesAt ? fmtDate(r.closesAt) : "—"}</TableCell>
                <TableCell className="pr-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="Aksi">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/sesi/${r.id}`}>
                          <Pencil /> Edit sesi & form
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/sesi/${r.id}/submisi`}>
                          <Users /> Lihat pendaftar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => copyLink(r.slug)}>
                        <Copy /> Salin link form
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={`/s/${r.slug}`} target="_blank">
                          <ExternalLink /> Buka form
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
