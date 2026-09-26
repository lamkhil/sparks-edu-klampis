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
} as const;

export type FieldType = keyof typeof FIELD_TYPES;

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
}

export const OPTION_TYPES: FieldType[] = ["select", "radio", "checkbox"];

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

const fieldSchema = z.object({
  id: z.string().min(1),
  key: z.string().regex(/^[a-z0-9_]+$/, "Key hanya huruf kecil, angka, underscore"),
  type: z.enum(Object.keys(FIELD_TYPES) as [FieldType, ...FieldType[]]),
  label: z.string().trim().min(1, "Label wajib diisi"),
  help: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.string().trim().min(1)).optional(),
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
    });
    const emails = fields.filter((f) => f.type === "email");
    if (emails.length !== 1 || !emails[0].required)
      ctx.addIssue({ code: "custom", path: [], message: "Form harus punya tepat 1 field Email yang wajib diisi" });
  });

/** Nama key field email (untuk kirim konfirmasi & verifikasi cek ulang). */
export function emailKey(fields: FormField[]) {
  return fields.find((f) => f.type === "email")?.key ?? "email";
}

/** Ambil nilai mentah dari FormData sesuai field. */
export function readFormData(fields: FormField[], fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const name = `f_${f.key}`;
    if (f.type === "checkbox") out[f.key] = fd.getAll(name).map(String);
    else out[f.key] = String(fd.get(name) ?? "").trim();
  }
  return out;
}

/** Skema zod dinamis untuk jawaban pengisi. */
export function answersSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodType> = {};
  for (const f of fields) {
    const req = `${f.label} wajib diisi`;
    let s: z.ZodType;
    switch (f.type) {
      case "email":
        s = z.string().max(200).pipe(f.required ? z.email("Format email tidak valid") : z.union([z.literal(""), z.email("Format email tidak valid")]));
        break;
      case "phone":
        s = z.string().regex(f.required ? /^\+?[0-9 ()-]{6,20}$/ : /^(\+?[0-9 ()-]{6,20})?$/, "Nomor tidak valid");
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
      case "checkbox": {
        const opts = f.options ?? [];
        s = z
          .array(z.string())
          .refine((arr) => arr.every((v) => opts.includes(v)), "Pilihan tidak valid")
          .refine((arr) => !f.required || arr.length > 0, req);
        break;
      }
      case "long_text":
        s = z.string().max(5000);
        break;
      default:
        s = z.string().max(500);
    }
    if (f.type !== "checkbox" && f.required) s = (s as z.ZodType<string>).refine((v) => v !== "", req);
    shape[f.key] = s;
  }
  return z.object(shape);
}

export type FieldErrors = Record<string, string>;

export function validateAnswers(fields: FormField[], raw: Record<string, unknown>) {
  const res = answersSchema(fields).safeParse(raw);
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

export function defaultFields(): FormField[] {
  return [
    { id: crypto.randomUUID(), key: "nama", type: "short_text", label: "Nama lengkap", required: true },
    { id: crypto.randomUUID(), key: "email", type: "email", label: "Email", required: true, help: "Konfirmasi & kode cek ulang dikirim ke email ini" },
    { id: crypto.randomUUID(), key: "no_hp", type: "phone", label: "No. WhatsApp", required: false },
  ];
}
