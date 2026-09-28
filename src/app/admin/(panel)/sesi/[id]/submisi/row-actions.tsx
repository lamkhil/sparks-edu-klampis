"use client";

import { BadgeCheck, CircleX, Clock, Eye, FileImage, MailPlus, MoreHorizontal, RotateCcw, Trash2, UserX } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatFieldAnswer, type FormField, type Slot } from "@/lib/form-schema";
import { fmtDate } from "@/lib/format";
import type { Submission } from "@/lib/types";
import { deleteSubmission, resendEmail, setPaymentStatus, setSubmissionStatus } from "../../actions";

type Confirm = "cancel" | "delete" | null;

export function RowActions({
  sub,
  fields,
  slots,
  hasPayment,
  proofs = [],
}: {
  sub: Submission;
  fields: FormField[];
  slots?: Slot[];
  hasPayment?: boolean;
  proofs?: { label: string; url: string | null }[];
}) {
  const [detail, setDetail] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(okMsg);
      else toast.error(r.error ?? "Gagal");
      setConfirm(null);
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Aksi" disabled={pending}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => setDetail(true)}>
            <Eye /> Lihat detail
          </DropdownMenuItem>
          {sub.email && (
            <DropdownMenuItem onSelect={() => run(() => resendEmail(sub.id), `Email dikirim ulang ke ${sub.email}`)}>
              <MailPlus /> Kirim ulang email
            </DropdownMenuItem>
          )}
          {proofs
            .filter((p) => p.url)
            .map((p) => (
              <DropdownMenuItem key={p.label} asChild>
                <a href={p.url!} target="_blank" rel="noreferrer">
                  <FileImage /> Lihat {p.label.toLowerCase()}
                </a>
              </DropdownMenuItem>
            ))}
          {hasPayment && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Pembayaran</DropdownMenuLabel>
              {sub.payment_status !== "paid" && (
                <DropdownMenuItem onSelect={() => run(() => setPaymentStatus(sub.id, "paid"), `${sub.code} ditandai lunas`)}>
                  <BadgeCheck /> Tandai lunas
                </DropdownMenuItem>
              )}
              {sub.payment_status !== "rejected" && (
                <DropdownMenuItem onSelect={() => run(() => setPaymentStatus(sub.id, "rejected"), `Pembayaran ${sub.code} ditolak`)}>
                  <CircleX /> Tolak pembayaran
                </DropdownMenuItem>
              )}
              {sub.payment_status !== "pending" && (
                <DropdownMenuItem onSelect={() => run(() => setPaymentStatus(sub.id, "pending"), `${sub.code} kembali ke menunggu`)}>
                  <Clock /> Kembalikan ke menunggu
                </DropdownMenuItem>
              )}
            </>
          )}
          <DropdownMenuSeparator />
          {sub.status === "active" ? (
            <DropdownMenuItem onSelect={() => setConfirm("cancel")}>
              <UserX /> Batalkan pendaftaran
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => run(() => setSubmissionStatus(sub.id, "active"), "Pendaftaran dipulihkan")}>
              <RotateCcw /> Pulihkan
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirm("delete")}>
            <Trash2 /> Hapus permanen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={detail} onOpenChange={setDetail}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono">
              {sub.code} <StatusBadge status={sub.status} />
            </DialogTitle>
            <DialogDescription>Didaftarkan {fmtDate(sub.created_at)}</DialogDescription>
          </DialogHeader>
          <dl className="divide-y rounded-lg border text-sm">
            {fields.map((f) => (
              <div key={f.id} className="grid grid-cols-3 gap-3 px-3 py-2.5">
                <dt className="text-muted-foreground">{f.label}</dt>
                <dd className="col-span-2 whitespace-pre-line break-words">{formatFieldAnswer(f, sub.answers[f.key], slots) || "—"}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="flex items-center gap-2">
              Email konfirmasi: <StatusBadge status={sub.email_status} />
            </span>
            {hasPayment && (
              <span className="flex items-center gap-2">
                Pembayaran: <StatusBadge status={sub.payment_status} kind="payment" />
              </span>
            )}
          </div>
          {proofs.some((p) => p.url) && (
            <div className="flex flex-wrap gap-2">
              {proofs
                .filter((p) => p.url)
                .map((p) => (
                  <Button key={p.label} variant="outline" size="sm" asChild>
                    <a href={p.url!} target="_blank" rel="noreferrer">
                      <FileImage /> {p.label}
                    </a>
                  </Button>
                ))}
            </div>
          )}
          {sub.email_error && <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{sub.email_error}</p>}
          <DialogFooter>
            {hasPayment && sub.payment_status !== "paid" && (
              <Button disabled={pending} onClick={() => run(() => setPaymentStatus(sub.id, "paid"), `${sub.code} ditandai lunas`)}>
                <BadgeCheck /> Tandai lunas
              </Button>
            )}
            {sub.email && (
              <Button variant="outline" disabled={pending} onClick={() => run(() => resendEmail(sub.id), `Email dikirim ulang ke ${sub.email}`)}>
                <MailPlus /> Kirim ulang email
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "delete" ? "Hapus pendaftaran ini?" : "Batalkan pendaftaran ini?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? `Data ${sub.code} akan dihapus permanen dan tidak bisa dikembalikan.`
                : `Slot kuota ${sub.code} akan dilepas untuk pendaftar lain. Bisa dipulihkan lagi selama kuota masih ada.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                if (confirm === "delete") run(() => deleteSubmission(sub.id), "Pendaftaran dihapus");
                else run(() => setSubmissionStatus(sub.id, "cancelled"), "Pendaftaran dibatalkan");
              }}
            >
              {confirm === "delete" ? "Hapus" : "Batalkan pendaftaran"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
