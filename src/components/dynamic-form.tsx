"use client";

import { useActionState } from "react";
import type { FieldErrors, FormField } from "@/lib/form-schema";
import { Alert, Button, Input, Label, Select, Textarea } from "./ui";

export type FormState = {
  errors?: FieldErrors;
  message?: string;
  success?: string;
  values?: Record<string, unknown>;
  nonce?: number;
} | null;

export function FieldInput({ field, value, disabled }: { field: FormField; value?: unknown; disabled?: boolean }) {
  const name = `f_${field.key}`;
  const id = `fld_${field.key}`;
  const str = typeof value === "string" ? value : "";
  const common = { id, name, disabled, placeholder: field.placeholder, defaultValue: str };

  switch (field.type) {
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
              <input type="radio" name={name} value={o} defaultChecked={str === o} disabled={disabled} className="h-4 w-4 accent-indigo-600" />
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
              <input type="checkbox" name={name} value={o} defaultChecked={arr.includes(o)} disabled={disabled} className="h-4 w-4 rounded accent-indigo-600" />
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
      <Label htmlFor={`fld_${field.key}`} required={field.required}>
        {field.label}
      </Label>
      {field.help && <p className="mb-2 -mt-0.5 text-xs text-gray-500">{field.help}</p>}
      <FieldInput field={field} value={value} disabled={disabled} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
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
}: {
  fields: FormField[];
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initialValues?: Record<string, unknown>;
  lockedKeys?: string[];
  submitLabel?: string;
  footer?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const values = state?.values ?? initialValues ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {state?.message && <Alert>{state.message}</Alert>}
      {state?.success && <Alert tone="success">{state.success}</Alert>}
      {/* key memaksa input memakai defaultValue terbaru setelah submit gagal */}
      <div key={state?.nonce ?? 0} className="space-y-5">
        {fields.map((f) => (
          <FieldBlock key={f.id} field={f} value={values[f.key]} error={state?.errors?.[f.key]} disabled={lockedKeys.includes(f.key)} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Memproses…" : submitLabel}
        </Button>
        {footer}
      </div>
    </form>
  );
}
