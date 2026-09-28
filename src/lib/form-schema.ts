import { z } from "zod";

export const FIELD_TYPES = {
  short_text: "Teks singkat",
  long_text: "Paragraf",
  email: "Email",
  phone: "No. HP / WhatsApp",
  number: "Angka",
  date: "Tanggal",
  select: "Dropdown",
  radio: "Pilihan ganda",
  checkbox: "Kotak centang",
  slot: "Jadwal berkuota",
  guests: "Bawa teman",
  file: "Upload file",
} as const;

export type FieldType = keyof typeof FIELD_TYPES;

/** Satu pilihan jadwal dengan kuota peserta & kuota teman sendiri. */
export interface Slot {
  id: string;
  label: string;
  quota: number;
  guest_quota: number;
}

/** Satu kolom isian untuk tiap teman (diatur di form builder). */
export interface GuestSubField {
  key: string;
  label: string;
  type: "short_text" | "phone" | "number";
  required: boolean;
  placeholder?: string;
}

export type Guest = Record<string, string>;

/** Key jawaban teman yang menyimpan jadwal pilihan teman itu (bisa beda dari jadwal pendaftar). */
export const GUEST_SLOT_KEY = "__jadwal";

/** Kolom bawaan jika field "Bawa teman" belum mengatur kolomnya sendiri. */
export const DEFAULT_GUEST_FIELDS: GuestSubField[] = [
  { key: "nama", label: "Nama teman", type: "short_text", required: true },
  { key: "usia", label: "Usia", type: "short_text", required: true, placeholder: "4 tahun" },
  { key: "telepon", label: "No. HP orang tua", type: "phone", required: true },
];

export function guestSubFields(f: FormField): GuestSubField[] {
  return f.guest_fields?.length ? f.guest_fields : DEFAULT_GUEST_FIELDS;
}

export interface FormField {
  id: string;
  /** Nama pendek untuk placeholder template, mis. `nama` → {{nama}} */
  key: string;
  type: FieldType;
  label: string;
  help?: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  /** type = select/radio: No. WhatsApp per opsi (mis. per Student Advisor) untuk tombol konfirmasi. */
  option_wa?: Record<string, string>;
  /** type = slot */
  slots?: Slot[];
  /** type = guests: maksimal teman per pendaftar */
  max_guests?: number;
  /** type = guests: kolom isian untuk tiap teman */
  guest_fields?: GuestSubField[];
}

export const OPTION_TYPES: FieldType[] = ["select", "radio", "checkbox"];
/** Tipe yang hanya boleh ada satu per form. */
export const SINGLETON_TYPES: FieldType[] = ["email", "slot", "guests"];

export function hasOptions(type: FieldType) {
  return OPTION_TYPES.includes(type);
}

export function slugifyKey(label: string) {
  return (
    label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "field"
  );
}

const slotSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]{1,40}$/),
  label: z.string().trim().min(1, "Nama jadwal wajib diisi").max(120),
  quota: z.coerce.number().int().min(0).max(100000),
  guest_quota: z.coerce.number().int().min(0).max(100000),
});

const fieldSchema = z.object({
  id: z.string().min(1),
  key: z.string().regex(/^[a-z0-9_]+$/, "Key hanya huruf kecil, angka, underscore"),
  type: z.enum(Object.keys(FIELD_TYPES) as [FieldType, ...FieldType[]]),
  label: z.string().trim().min(1, "Label wajib diisi"),
  help: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.string().trim().min(1)).optional(),
  option_wa: z.record(z.string(), z.string().regex(/^[0-9+ -]{0,20}$/, "No. WhatsApp opsi tidak valid")).optional(),
  slots: z.array(slotSchema).optional(),
  max_guests: z.coerce.number().int().min(1).max(10).optional(),
  guest_fields: z
    .array(
      z.object({
        key: z.string().regex(/^[a-z0-9_]+$/, "Key kolom teman hanya huruf kecil, angka, underscore"),
        label: z.string().trim().min(1, "Label kolom teman wajib diisi").max(80),
        type: z.enum(["short_text", "phone", "number"]),
        required: z.boolean(),
        placeholder: z.string().max(80).optional(),
      }),
    )
    .max(8)
    .optional(),
});

/** Validasi struktur form yang disusun admin. */
export const fieldsSchema = z
  .array(fieldSchema)
  .superRefine((fields, ctx) => {
    const keys = new Set<string>();
    fields.forEach((f, i) => {
      if (keys.has(f.key)) ctx.addIssue({ code: "custom", path: [i, "key"], message: `Key "${f.key}" dipakai lebih dari sekali` });
      keys.add(f.key);
      if (hasOptions(f.type) && (!f.options || f.options.length === 0))
        ctx.addIssue({ code: "custom", path: [i, "options"], message: `"${f.label}" butuh minimal 1 opsi` });
      if (f.type === "slot") {
        if (!f.slots?.length) ctx.addIssue({ code: "custom", path: [i, "slots"], message: `"${f.label}" butuh minimal 1 jadwal` });
        const ids = new Set(f.slots?.map((s) => s.id));
        if (ids.size !== (f.slots?.length ?? 0)) ctx.addIssue({ code: "custom", path: [i, "slots"], message: "ID jadwal tidak boleh sama" });
      }
    });
    for (const t of SINGLETON_TYPES) {
      if (fields.filter((f) => f.type === t).length > 1)
        ctx.addIssue({ code: "custom", path: [], message: `Field "${FIELD_TYPES[t]}" hanya boleh ada satu per form` });
    }
    if (!contactField(fields))
      ctx.addIssue({ code: "custom", path: [], message: "Form harus punya field Email atau No. HP yang wajib diisi (dipakai untuk cek ulang pendaftaran)" });
    if (fields.some((f) => f.type === "guests") && !fields.some((f) => f.type === "slot"))
      ctx.addIssue({ code: "custom", path: [], message: "Field \"Bawa teman\" membutuhkan field \"Jadwal berkuota\" (kuota teman diatur per jadwal)" });
  });

/** Key field email, jika form punya (email bisa opsional). */
export function emailKey(fields: FormField[]) {
  return fields.find((f) => f.type === "email")?.key;
}

/** Field wajib yang dipakai untuk verifikasi cek ulang: email wajib, atau No. HP wajib. */
export function contactField(fields: FormField[]) {
  return fields.find((f) => f.type === "email" && f.required) ?? fields.find((f) => f.type === "phone" && f.required);
}

/** Samakan format nomor HP: hanya angka, awalan 62 → 0. */
export function normalizePhone(v: string) {
  const d = v.replace(/\D/g, "");
  return d.startsWith("62") ? `0${d.slice(2)}` : d;
}

/** Cocokkan input cek ulang (email atau No. HP) dengan data pendaftar. */
export function matchesContact(fields: FormField[], sub: { email: string | null; answers: Record<string, unknown> }, input: string) {
  const v = input.trim();
  if (!v) return false;
  if (v.includes("@")) return !!sub.email && sub.email.toLowerCase() === v.toLowerCase();
  const want = normalizePhone(v);
  if (want.length < 6) return false;
  return fields.filter((f) => f.type === "phone").some((f) => normalizePhone(String(sub.answers[f.key] ?? "")) === want);
}

export const slotField = (fields: FormField[]) => fields.find((f) => f.type === "slot");
export const guestField = (fields: FormField[]) => fields.find((f) => f.type === "guests");

/** Jumlah teman per jadwal dari jawaban "Bawa teman"; teman tanpa jadwal ikut jadwal pendaftar. */
export function computeGuestSlots(guests: Guest[], registrantSlot: string | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const g of guests) {
    const id = g[GUEST_SLOT_KEY] || registrantSlot;
    if (!id) continue;
    out[id] = (out[id] ?? 0) + 1;
  }
  return out;
}
export const fileFields = (fields: FormField[]) => fields.filter((f) => f.type === "file");

/** Field yang tidak boleh diubah pengisi setelah submit (mempengaruhi kuota / verifikasi). */
export function lockedOnEdit(fields: FormField[]) {
  const contact = contactField(fields)?.key;
  return fields.filter((f) => ["email", "slot", "guests", "file"].includes(f.type) || f.key === contact).map((f) => f.key);
}

/** Total kuota sesi = jumlah kuota semua jadwal (jika ada field jadwal). */
export function slotsTotal(fields: FormField[]) {
  const f = slotField(fields);
  return f?.slots ? f.slots.reduce((a, s) => a + (Number(s.quota) || 0), 0) : null;
}

/** Ambil nilai mentah dari FormData sesuai field. */
export function readFormData(fields: FormField[], fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const name = `f_${f.key}`;
    if (f.type === "checkbox") out[f.key] = fd.getAll(name).map(String);
    else if (f.type === "guests") {
      if (fd.get(`${name}_bring`) !== "ya") {
        out[f.key] = [];
        continue;
      }
      const subs = guestSubFields(f);
      const cols = subs.map((sf) => fd.getAll(`${name}_${sf.key}`).map((v) => String(v).trim()));
      const slotCol = fd.getAll(`${name}_${GUEST_SLOT_KEY}`).map((v) => String(v).trim());
      const rows = Math.max(0, ...cols.map((c) => c.length), slotCol.length);
      out[f.key] = Array.from({ length: rows }, (_, i) => {
        const row: Guest = Object.fromEntries(subs.map((sf, j) => [sf.key, cols[j][i] ?? ""]));
        if (slotCol[i]) row[GUEST_SLOT_KEY] = slotCol[i];
        return row;
      }).filter((g) => Object.values(g).some(Boolean));
    } else out[f.key] = String(fd.get(name) ?? "").trim();
  }
  return out;
}

const phoneRe = /^\+?[0-9 ()-]{6,20}$/;

/** Skema zod dinamis untuk jawaban pengisi. `filePrefix` membatasi path bukti upload. */
export function answersSchema(fields: FormField[], filePrefix?: string) {
  const shape: Record<string, z.ZodType> = {};
  for (const f of fields) {
    const req = `${f.label} wajib diisi`;
    let s: z.ZodType;
    switch (f.type) {
      case "email":
        s = z.string().max(200).pipe(f.required ? z.email("Format email tidak valid") : z.union([z.literal(""), z.email("Format email tidak valid")]));
        break;
      case "phone":
        s = z.string().regex(f.required ? phoneRe : /^(\+?[0-9 ()-]{6,20})?$/, "Nomor tidak valid");
        break;
      case "number":
        s = z.string().regex(f.required ? /^-?\d+([.,]\d+)?$/ : /^(-?\d+([.,]\d+)?)?$/, "Harus berupa angka");
        break;
      case "date":
        s = z.string().regex(f.required ? /^\d{4}-\d{2}-\d{2}$/ : /^(\d{4}-\d{2}-\d{2})?$/, "Tanggal tidak valid");
        break;
      case "select":
      case "radio": {
        const opts = f.options ?? [];
        s = z.string().refine((v) => (v === "" ? !f.required : opts.includes(v)), f.required ? req : "Pilihan tidak valid");
        break;
      }
      case "slot": {
        const ids = (f.slots ?? []).map((x) => x.id);
        s = z.string().refine((v) => ids.includes(v), "Pilih salah satu jadwal");
        break;
      }
      case "checkbox": {
        const opts = f.options ?? [];
        s = z
          .array(z.string())
          .refine((arr) => arr.every((v) => opts.includes(v)), "Pilihan tidak valid")
          .refine((arr) => !f.required || arr.length > 0, req);
        break;
      }
      case "guests": {
        const max = f.max_guests ?? 1;
        const obj: Record<string, z.ZodType> = {};
        for (const sf of guestSubFields(f)) {
          let c: z.ZodType<string> = z.string().max(200);
          if (sf.type === "phone") c = z.string().regex(sf.required ? phoneRe : /^(\+?[0-9 ()-]{6,20})?$/, `${sf.label} tidak valid`);
          if (sf.type === "number") c = z.string().regex(sf.required ? /^\d+([.,]\d+)?$/ : /^(\d+([.,]\d+)?)?$/, `${sf.label} harus angka`);
          if (sf.required) c = c.refine((v) => v !== "", `${sf.label} wajib diisi`);
          obj[sf.key] = c;
        }
        const slotIds = (slotField(fields)?.slots ?? []).map((x) => x.id);
        if (slotIds.length) obj[GUEST_SLOT_KEY] = z.string().refine((v) => slotIds.includes(v), "Pilih jadwal teman");
        s = z
          .array(z.object(obj))
          .max(max, `Maksimal ${max} teman per pendaftar`)
          .refine((arr) => !f.required || arr.length > 0, req);
        break;
      }
      case "file": {
        const ok = (v: string) => v === "" || (!!filePrefix && v.startsWith(`${filePrefix}/`) && /^[a-z0-9/_.-]+$/i.test(v) && !v.includes(".."));
        s = z.string().refine(ok, "File tidak valid, silakan upload ulang");
        break;
      }
      case "long_text":
        s = z.string().max(5000);
        break;
      default:
        s = z.string().max(500);
    }
    if (!["checkbox", "guests", "slot"].includes(f.type) && f.required) s = (s as z.ZodType<string>).refine((v) => v !== "", f.type === "file" ? `${f.label} wajib diupload` : req);
    shape[f.key] = s;
  }
  return z.object(shape);
}

export type FieldErrors = Record<string, string>;

export function validateAnswers(fields: FormField[], raw: Record<string, unknown>, filePrefix?: string) {
  const res = answersSchema(fields, filePrefix).safeParse(raw);
  if (res.success) return { ok: true as const, data: res.data as Record<string, unknown> };
  const errors: FieldErrors = {};
  for (const issue of res.error.issues) {
    const k = String(issue.path[0] ?? "");
    if (!errors[k]) errors[k] = issue.message;
  }
  return { ok: false as const, errors };
}

export function formatAnswer(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "";
  return String(value);
}

export function formatGuests(field: FormField, value: unknown, slots?: Slot[]) {
  if (!Array.isArray(value) || value.length === 0) return "Tidak";
  const subs = guestSubFields(field);
  return (value as Guest[])
    .map((g) => {
      const parts = subs.map((sf) => `${sf.label}: ${g[sf.key] || "-"}`);
      const slotId = g[GUEST_SLOT_KEY];
      if (slotId && slots?.length) parts.push(`Jadwal: ${slots.find((s) => s.id === slotId)?.label ?? slotId}`);
      return parts.join(", ");
    })
    .join(" | ");
}

/** Jadwal teman → hitung berapa teman per jadwal, mis. "Sesi 1: 2, Sesi 2: 1". */
export function guestSlotsBreakdown(guestSlots: Record<string, number> | null | undefined, slots?: Slot[]) {
  const entries = Object.entries(guestSlots ?? {}).filter(([, v]) => v > 0);
  if (!entries.length) return "";
  return entries.map(([id, v]) => `${slots?.find((s) => s.id === id)?.label ?? id}: ${v}`).join(", ");
}

/** Format jawaban sesuai tipe field (label jadwal, daftar teman, dll). */
export function formatFieldAnswer(field: FormField, value: unknown, slots?: Slot[]): string {
  switch (field.type) {
    case "slot":
      return field.slots?.find((s) => s.id === value)?.label ?? formatAnswer(value);
    case "guests":
      return formatGuests(field, value, slots);
    case "file":
      return value ? "Terlampir" : "";
    default:
      return formatAnswer(value);
  }
}

export function newSlot(n: number): Slot {
  return { id: `jadwal_${Math.random().toString(36).slice(2, 7)}`, label: `Jadwal ${n}`, quota: 10, guest_quota: 0 };
}

export function defaultFields(): FormField[] {
  return [
    { id: crypto.randomUUID(), key: "nama", type: "short_text", label: "Nama lengkap", required: true },
    { id: crypto.randomUUID(), key: "email", type: "email", label: "Email", required: true, help: "Konfirmasi & kode cek ulang dikirim ke email ini" },
    { id: crypto.randomUUID(), key: "no_hp", type: "phone", label: "No. WhatsApp", required: false },
  ];
}
