"use client";

import { createContext, useActionState, useContext, useEffect, useMemo, useRef, useState } from "react";
import { guestSubFields, type FieldErrors, type FormField, type Guest } from "@/lib/form-schema";
import type { SlotUsage } from "@/lib/types";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Alert, Button, Input, Label, Select, Textarea, cn } from "./kit";

export type FormState = {
  errors?: FieldErrors;
  message?: string;
  success?: string;
  values?: Record<string, unknown>;
  nonce?: number;
} | null;

export type UploadAction = (ext: string) => Promise<{ ok: true; path: string; token: string } | { ok: false; error: string }>;

type Ctx = {
  usage: SlotUsage;
  slot: string;
  setSlot: (v: string) => void;
  slotsOf: FormField | undefined;
  upload?: UploadAction;
  setUploading: (delta: number) => void;
  setGuests: (n: number) => void;
};
const FormCtx = createContext<Ctx | null>(null);

function remaining(field: FormField | undefined, usage: SlotUsage, slotId: string) {
  const s = field?.slots?.find((x) => x.id === slotId);
  if (!s) return null;
  const u = usage[slotId] ?? { used: 0, guests: 0 };
  return { seats: Math.max(0, s.quota - u.used), guests: Math.max(0, s.guest_quota - u.guests) };
}

function SlotInput({ field, value, disabled }: { field: FormField; value?: unknown; disabled?: boolean }) {
  const ctx = useContext(FormCtx);
  const usage = ctx?.usage ?? {};
  const selected = ctx?.slot || (typeof value === "string" ? value : "");
  return (
    <div className="grid gap-3" role="radiogroup">
      {disabled && <input type="hidden" name={`f_${field.key}`} value={selected} />}
      {field.slots?.map((s) => {
        const r = remaining(field, usage, s.id)!;
        const full = r.seats <= 0 && selected !== s.id;
        return (
          <label
            key={s.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-2xl border bg-white p-4 transition",
              selected === s.id ? "border-brand-500 ring-4 ring-brand-100" : "border-line hover:border-brand-300",
              (full || disabled) && "cursor-not-allowed opacity-60 hover:border-line",
            )}
          >
            <input
              type="radio"
              name={disabled ? undefined : `f_${field.key}`}
              value={s.id}
              checked={selected === s.id}
              disabled={full || disabled}
              onChange={() => ctx?.setSlot(s.id)}
              className="h-4 w-4 accent-brand-600"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink">{s.label}</span>
              {s.guest_quota > 0 && (
                <span className="block text-xs text-muted-foreground">Kuota teman: {r.guests > 0 ? `sisa ${r.guests} dari ${s.guest_quota}` : "habis"}</span>
              )}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
                r.seats <= 0 ? "bg-berry-500/10 text-[#c20048]" : r.seats <= 3 ? "bg-sun-100 text-sun-700" : "bg-brand-50 text-brand-700",
              )}
            >
              {r.seats <= 0 ? "Penuh" : `Sisa ${r.seats} kursi`}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function GuestsInput({ field, value, disabled }: { field: FormField; value?: unknown; disabled?: boolean }) {
  const ctx = useContext(FormCtx);
  const initial = Array.isArray(value) ? (value as Guest[]) : [];
  const [bring, setBring] = useState(initial.length > 0);
  const [count, setCount] = useState(Math.max(1, initial.length));
  const max = field.max_guests ?? 1;
  const r = ctx?.slot ? remaining(ctx.slotsOf, ctx.usage, ctx.slot) : null;
  const allowed = r ? Math.min(max, r.guests) : max;
  const blocked = r !== null && r.guests <= 0;
  const name = `f_${field.key}`;
  const effective = bring && !blocked ? Math.min(count, allowed) : 0;
  useEffect(() => ctx?.setGuests(effective), [effective, ctx]);
  const subs = guestSubFields(field);

  if (disabled) {
    return (
      <p className="rounded-xl bg-cream px-3.5 py-2.5 text-sm">
        {initial.length ? initial.map((g) => Object.values(g).filter(Boolean).join(" · ")).join(", ") : "Tidak membawa teman"}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {!ctx?.slot && <p className="text-xs text-muted-foreground">Pilih jadwal terlebih dahulu untuk melihat sisa kuota teman.</p>}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["tidak", "Tidak"],
            ["ya", "Ya, bawa teman"],
          ] as const
        ).map(([v, label]) => (
          <label
            key={v}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
              (v === "ya") === (bring && !blocked) ? "border-brand-500 bg-brand-50 text-brand-800" : "border-line bg-white",
              v === "ya" && blocked && "cursor-not-allowed opacity-50",
            )}
          >
            <input
              type="radio"
              name={`${name}_bring`}
              value={v}
              checked={(v === "ya") === (bring && !blocked)}
              disabled={v === "ya" && blocked}
              onChange={() => setBring(v === "ya")}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>
      {blocked && <p className="text-xs font-medium text-[#c20048]">Kuota teman untuk jadwal ini sudah habis.</p>}
      {bring && !blocked && (
        <div className="space-y-3">
          {Array.from({ length: Math.min(count, allowed) }, (_, i) => (
            <div key={i} className="grid gap-3 rounded-2xl border border-line bg-cream/60 p-4 sm:grid-cols-2">
              {allowed > 1 && <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground sm:col-span-2">Teman {i + 1}</p>}
              {subs.map((sf) => (
                <div key={sf.key}>
                  <Label required={sf.required}>{sf.label}</Label>
                  <Input
                    name={`${name}_${sf.key}`}
                    defaultValue={initial[i]?.[sf.key]}
                    placeholder={sf.placeholder}
                    type={sf.type === "phone" ? "tel" : "text"}
                    inputMode={sf.type === "phone" ? "tel" : sf.type === "number" ? "decimal" : undefined}
                  />
                </div>
              ))}
            </div>
          ))}
          {count < allowed && (
            <Button type="button" variant="secondary" onClick={() => setCount((c) => c + 1)}>
              + Tambah teman
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function FileInput({ field, value, disabled }: { field: FormField; value?: unknown; disabled?: boolean }) {
  const ctx = useContext(FormCtx);
  const [path, setPath] = useState(typeof value === "string" ? value : "");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  if (disabled) return <p className="rounded-xl bg-cream px-3.5 py-2.5 text-sm">{path ? "✓ File sudah diupload" : "Tidak ada file"}</p>;

  const onPick = async (file: File) => {
    setErr(null);
    if (file.size > 5 * 1024 * 1024) return setErr("Ukuran file maksimal 5 MB.");
    if (!ctx?.upload) return setErr("Upload tidak tersedia.");
    setBusy(true);
    ctx.setUploading(1);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const res = await ctx.upload(ext);
      if (!res.ok) throw new Error(res.error);
      const { error } = await createBrowserSupabase().storage.from("payments").uploadToSignedUrl(res.path, res.token, file, { contentType: file.type });
      if (error) throw error;
      setPath(res.path);
      setFileName(file.name);
    } catch {
      setErr("Upload gagal, coba lagi.");
      setPath("");
    } finally {
      setBusy(false);
      ctx.setUploading(-1);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <div>
      <input type="hidden" name={`f_${field.key}`} value={path} />
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border-2 border-dashed p-4 text-left text-sm transition",
          path ? "border-brand-300 bg-brand-50" : "border-line bg-white hover:border-brand-300",
        )}
      >
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg", path ? "bg-brand-600 text-white" : "bg-sun-100")}>{path ? "✓" : "⇪"}</span>
        <span>
          <span className="block font-semibold text-ink">{busy ? "Mengupload…" : path ? fileName || "File terupload" : "Pilih file"}</span>
          <span className="block text-xs text-muted-foreground">{path ? "Klik untuk mengganti file" : "JPG, PNG, WebP atau PDF · maks 5 MB"}</span>
        </span>
      </button>
      {err && <p className="mt-1 text-xs text-[#c20048]">{err}</p>}
    </div>
  );
}

export function FieldInput({ field, value, disabled }: { field: FormField; value?: unknown; disabled?: boolean }) {
  const name = `f_${field.key}`;
  const id = `fld_${field.key}`;
  const str = typeof value === "string" ? value : "";
  const common = { id, name, disabled, placeholder: field.placeholder, defaultValue: str };

  switch (field.type) {
    case "slot":
      return <SlotInput field={field} value={value} disabled={disabled} />;
    case "guests":
      return <GuestsInput field={field} value={value} disabled={disabled} />;
    case "file":
      return <FileInput field={field} value={value} disabled={disabled} />;
    case "long_text":
      return <Textarea {...common} rows={4} />;
    case "email":
      return <Input {...common} type="email" autoComplete="email" />;
    case "phone":
      return <Input {...common} type="tel" inputMode="tel" autoComplete="tel" />;
    case "number":
      return <Input {...common} type="text" inputMode="decimal" />;
    case "date":
      return <Input {...common} type="date" />;
    case "select":
      return (
        <Select {...common}>
          <option value="">{field.placeholder || "— Pilih —"}</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      );
    case "radio":
      return (
        <div className="space-y-2">
          {field.options?.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm">
              <input type="radio" name={name} value={o} defaultChecked={str === o} disabled={disabled} className="h-4 w-4 accent-brand-600" />
              {o}
            </label>
          ))}
        </div>
      );
    case "checkbox": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2">
          {field.options?.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={name} value={o} defaultChecked={arr.includes(o)} disabled={disabled} className="h-4 w-4 rounded accent-brand-600" />
              {o}
            </label>
          ))}
        </div>
      );
    }
    default:
      return <Input {...common} type="text" />;
  }
}

export function FieldBlock({ field, value, error, disabled }: { field: FormField; value?: unknown; error?: string; disabled?: boolean }) {
  return (
    <div>
      <Label htmlFor={`fld_${field.key}`} required={field.required || field.type === "slot"}>
        {field.label}
      </Label>
      {field.help && <p className="-mt-0.5 mb-2 whitespace-pre-line text-xs text-muted-foreground">{field.help}</p>}
      <FieldInput field={field} value={value} disabled={disabled} />
      {error && <p className="mt-1 text-xs text-[#c20048]">{error}</p>}
    </div>
  );
}

export function DynamicForm({
  fields,
  action,
  initialValues,
  lockedKeys = [],
  submitLabel = "Kirim",
  footer,
  slotUsage = {},
  upload,
  pricing,
}: {
  fields: FormField[];
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initialValues?: Record<string, unknown>;
  lockedKeys?: string[];
  submitLabel?: string;
  footer?: React.ReactNode;
  slotUsage?: SlotUsage;
  upload?: UploadAction;
  /** Harga per pendaftar & per teman untuk menampilkan total langsung. */
  pricing?: { fee: number; guestFee: number } | null;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const values = state?.values ?? initialValues ?? {};
  const slotsOf = fields.find((f) => f.type === "slot");
  const [slot, setSlot] = useState(slotsOf && typeof values[slotsOf.key] === "string" ? (values[slotsOf.key] as string) : "");
  const [uploading, setUploadingN] = useState(0);
  const [guests, setGuests] = useState(0);
  const ctxValue = useMemo(
    () => ({ usage: slotUsage, slot, setSlot, slotsOf, upload, setUploading: (d: number) => setUploadingN((n) => n + d), setGuests }),
    [slotUsage, slot, slotsOf, upload],
  );
  const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  return (
    <FormCtx.Provider value={ctxValue}>
      <form action={formAction} className="space-y-6" noValidate>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        {state?.message && <Alert>{state.message}</Alert>}
        {state?.success && <Alert tone="success">{state.success}</Alert>}
        {/* key memaksa input memakai defaultValue terbaru setelah submit gagal */}
        <div key={state?.nonce ?? 0} className="space-y-6">
          {fields.map((f) => (
            <FieldBlock key={f.id} field={f} value={values[f.key]} error={state?.errors?.[f.key]} disabled={lockedKeys.includes(f.key)} />
          ))}
        </div>
        {pricing && (
          <div className="flex flex-wrap items-end justify-between gap-2 rounded-2xl bg-sun-50 p-4 ring-1 ring-sun-200">
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold text-ink">Total pembayaran</p>
              <p>
                1 pendaftar × {rupiah(pricing.fee)}
                {guests > 0 && ` + ${guests} teman × ${rupiah(pricing.guestFee)}`}
              </p>
            </div>
            <p className="text-2xl font-extrabold text-ink">{rupiah(pricing.fee + guests * pricing.guestFee)}</p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button type="submit" disabled={pending || uploading > 0}>
            {pending ? "Memproses…" : uploading > 0 ? "Menunggu upload…" : submitLabel}
          </Button>
          {footer}
        </div>
      </form>
    </FormCtx.Provider>
  );
}
