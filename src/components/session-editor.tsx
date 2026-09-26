"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FormBuilder, SlotsEditor } from "@/components/form-builder/form-builder";
import { PromoEditor } from "@/components/promo-editor";
import { Alert, Button, Input, Label, Select, Textarea, Toggle, cn } from "@/components/kit";
import type { SessionInput, SaveResult } from "@/app/admin/(panel)/sesi/actions";
import { newSlot, slotsTotal, type FormField, type Slot } from "@/lib/form-schema";
import type { Session, SlotUsage } from "@/lib/types";
import { BUILTIN_PLACEHOLDERS, DEFAULT_REMINDERS, type Reminder } from "@/lib/template";

// Semua waktu di admin memakai WIB (UTC+7) agar konsisten di server & browser.
const WIB_MS = 7 * 3600 * 1000;
function toWib(iso: string | null) {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + WIB_MS).toISOString().slice(0, 16);
}
function fromWib(v: string) {
  return v ? new Date(`${v}:00+07:00`).toISOString() : null;
}

const TABS = [
  ["detail", "Detail & Kuota"],
  ["promo", "Promosi & Poster"],
  ["form", "Form"],
  ["penutup", "Pesan Penutup"],
  ["email", "Email"],
  ["pengingat", "Pengingat"],
  ["akses", "Cek Ulang & Akses"],
] as const;
type Tab = (typeof TABS)[number][0];

const BUILTIN = Object.keys(BUILTIN_PLACEHOLDERS);

function Placeholders({ fields }: { fields: FormField[] }) {
  const keys = [...BUILTIN, ...fields.map((f) => f.key).filter((k) => !BUILTIN.includes(k))];
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <span className="text-xs text-muted-foreground">Placeholder:</span>
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          title="Klik untuk menyalin"
          onClick={() => navigator.clipboard.writeText(`{{${k}}}`)}
          className="rounded bg-cream px-1.5 py-0.5 font-mono text-xs text-muted-foreground hover:bg-brand-100"
        >{`{{${k}}}`}</button>
      ))}
    </div>
  );
}

export function SessionEditor({
  session,
  save,
  appUrl,
  usage,
}: {
  session: Session;
  save: (input: SessionInput) => Promise<SaveResult>;
  appUrl: string;
  usage?: SlotUsage;
}) {
  const [tab, setTab] = useState<Tab>("detail");
  const [s, setS] = useState(() => ({
    ...session,
    opens_at: toWib(session.opens_at),
    closes_at: toWib(session.closes_at),
    edit_deadline: toWib(session.edit_deadline),
    promo: session.promo ?? {},
    reminders: session.reminders?.length ? session.reminders : DEFAULT_REMINDERS,
  }));
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);
  const [pending, start] = useTransition();

  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => {
    setS((prev) => ({ ...prev, [k]: v }));
    setDirty(true);
    setResult(null);
  };

  const onSave = () =>
    start(async () => {
      const res = await save({
        title: s.title,
        slug: s.slug,
        description: s.description,
        status: s.status,
        quota: slotsTotal(s.fields) ?? s.quota,
        opens_at: fromWib(s.opens_at),
        closes_at: fromWib(s.closes_at),
        edit_deadline: fromWib(s.edit_deadline),
        fields: s.fields.map((f) => ({ ...f, options: f.options?.map((o) => o.trim()).filter(Boolean) })),
        success_message: s.success_message,
        email_enabled: s.email_enabled,
        email_subject: s.email_subject,
        email_body: s.email_body,
        allow_view: s.allow_view,
        allow_edit: s.allow_edit,
        allow_cancel: s.allow_cancel,
        one_per_email: s.one_per_email,
        track_payment: s.track_payment ?? false,
        reminders: s.reminders,
        promo: {
          ...s.promo,
          includes: s.promo.includes?.map((i) => i.trim()).filter(Boolean),
        },
      });
      setResult(res);
      if (res.ok) {
        setDirty(false);
        toast.success("Perubahan tersimpan");
      } else toast.error(res.error);
    });

  const publicUrl = `${appUrl}/s/${s.slug}`;
  const setReminder = (i: number, patch: Partial<Reminder>) => set("reminders", s.reminders.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const slotQuota = slotsTotal(s.fields);
  const slotFieldObj = s.fields.find((f) => f.type === "slot");
  const setSlots = (slots: Slot[]) => set("fields", s.fields.map((f) => (f.type === "slot" ? { ...f, slots } : f)));
  // Ubah kuota tunggal menjadi kuota per jadwal: tambahkan pertanyaan "Pilih jadwal" setelah field email.
  const splitIntoSlots = () => {
    const field: FormField = {
      id: crypto.randomUUID(),
      key: s.fields.some((f) => f.key === "jadwal") ? "jadwal_sesi" : "jadwal",
      type: "slot",
      label: "Pilih jadwal",
      required: true,
      slots: [{ ...newSlot(1), quota: s.quota }],
    };
    const at = s.fields.findIndex((f) => f.type === "email") + 1;
    set("fields", [...s.fields.slice(0, at), field, ...s.fields.slice(at)]);
  };

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 mb-6 border-b border-line bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight">{s.title || "Tanpa judul"}</h1>
            <p className="text-xs text-muted-foreground">{dirty ? "Ada perubahan yang belum disimpan" : "Semua perubahan tersimpan"}</p>
          </div>
          <Select value={s.status} onChange={(e) => set("status", e.target.value as Session["status"])} className="w-44 py-2">
            <option value="draft">Draft</option>
            <option value="published">Dibuka (publish)</option>
            <option value="closed">Ditutup</option>
          </Select>
          <Button type="button" onClick={onSave} disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
        {result && !result.ok && (
          <div className="mt-3">
            <Alert>{result.error}</Alert>
          </div>
        )}
        <nav className="mt-4 inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-muted p-1">
          {TABS.map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition",
                tab === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {tab === "detail" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label required>Judul</Label>
            <Input value={s.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label required>Slug (alamat form)</Label>
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-sm text-muted-foreground">{appUrl}/s/</span>
              <Input value={s.slug} className="font-mono" onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
            </div>
            {session.status === "published" && (
              <p className="mt-1 text-xs">
                <a href={publicUrl} target="_blank" className="text-brand-600 hover:underline">
                  Buka form ↗
                </a>
                <button type="button" onClick={() => navigator.clipboard.writeText(publicUrl)} className="ml-3 text-muted-foreground hover:underline">
                  Salin link
                </button>
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <Label>Deskripsi</Label>
            <Textarea rows={4} value={s.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          {slotFieldObj ? (
            <div className="rounded-2xl border border-line bg-cream/60 p-4 sm:col-span-2">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <Label>Jadwal & kuota</Label>
                  <p className="text-xs text-muted-foreground">
                    Pendaftar memilih salah satu jadwal di pertanyaan &quot;{slotFieldObj.label}&quot;. Kuota teman = jumlah teman non-siswa yang boleh ikut di jadwal itu.
                  </p>
                </div>
                <p className="text-sm">
                  Total kuota sesi: <b>{slotQuota}</b>
                </p>
              </div>
              <SlotsEditor slots={slotFieldObj.slots ?? []} onChange={setSlots} usage={usage} bare />
            </div>
          ) : (
            <div>
              <Label required>Kuota maksimal pengisi</Label>
              <Input type="number" min={0} value={s.quota} onChange={(e) => set("quota", Number(e.target.value))} />
              <p className="mt-1 text-xs text-muted-foreground">
                Isian yang dibatalkan tidak dihitung, slotnya kembali tersedia.{" "}
                <button type="button" onClick={splitIntoSlots} className="font-semibold text-brand-700 hover:underline">
                  Bagi kuota per jadwal →
                </button>
              </p>
            </div>
          )}
          <div className="flex flex-col justify-end gap-4 sm:col-span-2 sm:flex-row sm:gap-8">
            <Toggle
              checked={s.one_per_email}
              onChange={(v) => set("one_per_email", v)}
              label="Satu email hanya boleh mengisi sekali"
              hint="Matikan jika satu orang tua boleh mendaftarkan beberapa anak."
            />
            <Toggle
              checked={s.track_payment ?? false}
              onChange={(v) => set("track_payment", v)}
              label="Lacak status pembayaran"
              hint="Pendaftar baru berstatus Menunggu; admin menandai Lunas setelah konfirmasi."
            />
          </div>
          <div>
            <Label>Dibuka mulai (WIB)</Label>
            <Input type="datetime-local" value={s.opens_at} onChange={(e) => set("opens_at", e.target.value)} />
            <p className="mt-1 text-xs text-muted-foreground">Kosongkan = langsung dibuka saat publish.</p>
          </div>
          <div>
            <Label>Ditutup pada (WIB)</Label>
            <Input type="datetime-local" value={s.closes_at} onChange={(e) => set("closes_at", e.target.value)} />
            <p className="mt-1 text-xs text-muted-foreground">Kosongkan = tidak ada batas waktu (tutup saat kuota penuh).</p>
          </div>
          <div className="sm:col-span-2">
            <Label>Catatan internal (hanya admin)</Label>
            <Textarea
              rows={5}
              value={s.promo.internal_notes ?? ""}
              placeholder={"Pendamping: EC …, admin …\nSetor list peserta: Senin, 5 Okt"}
              onChange={(e) => set("promo", { ...s.promo, internal_notes: e.target.value })}
            />
            <p className="mt-1 text-xs text-muted-foreground">Tidak pernah ditampilkan di halaman publik.</p>
          </div>
        </div>
      )}

      {tab === "promo" && <PromoEditor sessionId={session.id} promo={s.promo} onChange={(p) => set("promo", p)} />}

      {tab === "form" && <FormBuilder fields={s.fields} onChange={(f) => set("fields", f)} />}

      {tab === "penutup" && (
        <div>
          <Label>Pesan setelah form dikirim</Label>
          <Textarea rows={8} value={s.success_message} onChange={(e) => set("success_message", e.target.value)} />
          <Placeholders fields={s.fields} />
          <p className="mt-3 text-xs text-muted-foreground">
            Kode pendaftaran & kartu Pembayaran (total, rekening, tombol WhatsApp) selalu tampil di bawah pesan ini. Tulis <code>[[teks]]</code> agar teks bisa disalin
            dengan sekali klik.
          </p>
        </div>
      )}

      {tab === "email" && (
        <div className="space-y-5">
          <Toggle checked={s.email_enabled} onChange={(v) => set("email_enabled", v)} label="Kirim email konfirmasi via SMTP" hint="Pengaturan server SMTP ada di menu Pengaturan SMTP." />
          <div>
            <Label>Subjek</Label>
            <Input value={s.email_subject} disabled={!s.email_enabled} onChange={(e) => set("email_subject", e.target.value)} />
          </div>
          <div>
            <Label>Isi email</Label>
            <Textarea rows={10} value={s.email_body} disabled={!s.email_enabled} onChange={(e) => set("email_body", e.target.value)} />
            <Placeholders fields={s.fields} />
            <p className="mt-2 text-xs text-muted-foreground">Ringkasan seluruh isian otomatis dilampirkan di bawah isi email.</p>
          </div>
        </div>
      )}

      {tab === "pengingat" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Template pesan untuk tombol <b>Kirim pengingat</b> di halaman Pendaftar (via WhatsApp wa.me atau email). Boleh pakai placeholder.
          </p>
          {s.reminders.map((r, i) => (
            <div key={r.id} className="space-y-3 rounded-2xl border border-line bg-white p-4">
              <div className="flex gap-2">
                <Input value={r.name} placeholder="Nama pengingat" onChange={(e) => setReminder(i, { name: e.target.value })} />
                <Button type="button" variant="ghost" onClick={() => set("reminders", s.reminders.filter((_, j) => j !== i))}>
                  Hapus
                </Button>
              </div>
              <Input value={r.email_subject ?? ""} placeholder="Subjek email (jika dikirim via email)" onChange={(e) => setReminder(i, { email_subject: e.target.value })} />
              <Textarea rows={8} value={r.text} onChange={(e) => setReminder(i, { text: e.target.value })} />
            </div>
          ))}
          <Placeholders fields={s.fields} />
          <Button
            type="button"
            variant="secondary"
            onClick={() => set("reminders", [...s.reminders, { id: `r_${Date.now().toString(36)}`, name: "Pengingat baru", text: "Halo, {{kode}}…" }])}
          >
            + Tambah template pengingat
          </Button>
        </div>
      )}

      {tab === "akses" && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">Pengisi bisa membuka halaman Cek Ulang dengan kode submission + email.</p>
          <Toggle checked={s.allow_view} onChange={(v) => set("allow_view", v)} label="Tampilkan detail isian" hint="Jika mati, pengisi hanya melihat status (terdaftar/dibatalkan)." />
          <Toggle checked={s.allow_edit} onChange={(v) => set("allow_edit", v)} label="Izinkan mengubah isian" hint="Email tidak bisa diubah karena dipakai untuk verifikasi." />
          <Toggle checked={s.allow_cancel} onChange={(v) => set("allow_cancel", v)} label="Izinkan membatalkan pendaftaran" hint="Slot kuota yang dibatalkan kembali tersedia untuk orang lain." />
          <div className="max-w-sm">
            <Label>Batas waktu ubah/batal (WIB)</Label>
            <Input
              type="datetime-local"
              value={s.edit_deadline}
              disabled={!s.allow_edit && !s.allow_cancel}
              onChange={(e) => set("edit_deadline", e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">Kosongkan = boleh sampai sesi ditutup.</p>
          </div>
        </div>
      )}
    </div>
  );
}
