"use client";

import { BellRing, Mail } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { whatsappLink } from "@/lib/promo";
import { renderTemplate, stripCopyMarks, type Reminder } from "@/lib/template";
import type { PaymentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { sendReminderEmails } from "../../actions";

export type ReminderRecipient = {
  id: string;
  code: string;
  name: string;
  slot: string | null;
  slotLabel: string;
  payment: PaymentStatus;
  phone: string;
  email: string | null;
  vars: Record<string, string>;
};

const PAY_FILTERS: [string, string][] = [
  ["all", "Semua"],
  ["pending", "Belum bayar"],
  ["paid", "Lunas"],
];

export function ReminderDialog({
  sessionId,
  reminders,
  recipients,
  slots,
  hasPayment,
}: {
  sessionId: string;
  reminders: Reminder[];
  recipients: ReminderRecipient[];
  slots: { id: string; label: string }[];
  hasPayment: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [rid, setRid] = useState(reminders[0]?.id ?? "");
  const [pay, setPay] = useState(hasPayment ? "pending" : "all");
  const [slot, setSlot] = useState("");
  const [clicked, setClicked] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const reminder = reminders.find((r) => r.id === rid);

  const list = useMemo(
    () => recipients.filter((r) => (pay === "all" || (pay === "pending" ? ["pending", "rejected"].includes(r.payment) : r.payment === pay)) && (!slot || r.slot === slot)),
    [recipients, pay, slot],
  );
  const withEmail = list.filter((r) => r.email);
  const render = (r: ReminderRecipient) => (reminder ? stripCopyMarks(renderTemplate(reminder.text, r.vars)) : "");

  const sendEmails = () =>
    start(async () => {
      const res = await sendReminderEmails(sessionId, rid, withEmail.map((r) => r.id));
      if (!res.ok) return void toast.error(res.error);
      toast.success(`Email terkirim ke ${res.sent} pendaftar${res.failed.length ? `, gagal: ${res.failed.join(", ")}` : ""}`);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <BellRing /> Kirim pengingat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kirim pengingat</DialogTitle>
          <DialogDescription>
            Klik tombol WhatsApp untuk membuka chat (wa.me) dengan pesan terisi otomatis, satu per satu. Teks pengingat diatur di Edit sesi → tab Pengingat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {reminders.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRid(r.id)}
              className={cn("rounded-full border px-3 py-1.5 text-sm font-medium", rid === r.id ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted")}
            >
              {r.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          {hasPayment && (
            <div className="inline-flex rounded-lg bg-muted p-1">
              {PAY_FILTERS.map(([v, l]) => (
                <button key={v} type="button" onClick={() => setPay(v)} className={cn("rounded-md px-3 py-1 font-medium text-muted-foreground", pay === v && "bg-background text-foreground shadow-sm")}>
                  {l}
                </button>
              ))}
            </div>
          )}
          {slots.length > 0 && (
            <select value={slot} onChange={(e) => setSlot(e.target.value)} className="rounded-lg border bg-background px-2 py-1">
              <option value="">Semua jadwal</option>
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {list[0] && reminder && (
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Contoh pesan untuk {list[0].name}</p>
            <p className="whitespace-pre-line text-sm">{render(list[0])}</p>
          </div>
        )}

        <div className="divide-y rounded-xl border">
          {list.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">Tidak ada penerima.</p>}
          {list.map((r) => {
            const href = whatsappLink(r.phone, render(r));
            return (
              <div key={r.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.code} {r.slotLabel && `· ${r.slotLabel}`} {r.phone && `· ${r.phone}`}
                  </p>
                </div>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setClicked((c) => new Set(c).add(r.id))}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white",
                      clicked.has(r.id) ? "bg-[#1f9d55]/50" : "bg-[#1f9d55] hover:bg-[#188047]",
                    )}
                  >
                    {clicked.has(r.id) ? "✓ Dibuka" : "WhatsApp"}
                  </a>
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground">Tanpa No. HP</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {list.length} penerima · {clicked.size} chat dibuka
          </p>
          <Button variant="outline" disabled={pending || withEmail.length === 0 || !reminder} onClick={sendEmails}>
            <Mail /> {pending ? "Mengirim…" : `Kirim email ke ${withEmail.length} yang punya email`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
