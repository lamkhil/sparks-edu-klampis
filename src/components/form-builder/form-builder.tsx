"use client";

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { FieldBlock } from "@/components/dynamic-form";
import { Button, Input, Label, Select, Textarea, cn } from "@/components/kit";
import { DEFAULT_GUEST_FIELDS, FIELD_TYPES, guestSubFields, hasOptions, newSlot, slugifyKey, type FieldType, type FormField, type GuestSubField, type Slot } from "@/lib/form-schema";
import type { SlotUsage } from "@/lib/types";

function uniqueKey(base: string, fields: FormField[], selfId?: string) {
  const taken = new Set(fields.filter((f) => f.id !== selfId).map((f) => f.key));
  let k = base;
  for (let i = 2; taken.has(k); i++) k = `${base}_${i}`;
  return k;
}

export function FormBuilder({ fields, onChange }: { fields: FormField[]; onChange: (f: FormField[]) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const update = (id: string, patch: Partial<FormField>) => onChange(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const remove = (id: string) => onChange(fields.filter((f) => f.id !== id));
  const duplicate = (f: FormField) => {
    const copy = { ...f, id: crypto.randomUUID(), label: `${f.label} (salinan)`, key: uniqueKey(f.key, fields) };
    const i = fields.findIndex((x) => x.id === f.id);
    onChange([...fields.slice(0, i + 1), copy, ...fields.slice(i + 1)]);
    setOpenId(copy.id);
  };
  const add = (type: FieldType) => {
    const label = FIELD_TYPES[type];
    const f: FormField = {
      id: crypto.randomUUID(),
      type,
      label: `Pertanyaan ${fields.length + 1}`,
      key: uniqueKey(slugifyKey(label), fields),
      required: false,
      ...typeDefaults(type),
    };
    onChange([...fields, f]);
    setOpenId(f.id);
  };
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = fields.findIndex((f) => f.id === e.active.id);
    const to = fields.findIndex((f) => f.id === e.over!.id);
    onChange(arrayMove(fields, from, to));
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Seret ⋮⋮ untuk mengurutkan. Wajib ada tepat satu field Email (untuk konfirmasi & cek ulang).</p>
        <Button type="button" variant="secondary" onClick={() => setPreview((p) => !p)}>
          {preview ? "Kembali ke editor" : "Pratinjau"}
        </Button>
      </div>

      {preview ? (
        <div className="space-y-5 rounded-xl border border-dashed border-line bg-cream p-6">
          {fields.map((f) => (
            <FieldBlock key={f.id} field={f} />
          ))}
        </div>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {fields.map((f) => (
                  <FieldCard
                    key={f.id}
                    field={f}
                    open={openId === f.id}
                    onToggle={() => setOpenId(openId === f.id ? null : f.id)}
                    onChange={(patch) => update(f.id, patch)}
                    onRemove={() => remove(f.id)}
                    onDuplicate={() => duplicate(f)}
                    keyFor={(label) => uniqueKey(slugifyKey(label), fields, f.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="mt-4 rounded-xl border border-dashed border-line p-4">
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Tambah pertanyaan</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(FIELD_TYPES) as FieldType[]).map((t) => (
                <button key={t} type="button" onClick={() => add(t)} className="rounded-full border border-line bg-white px-3 py-1 text-sm hover:border-brand-400 hover:text-brand-700">
                  + {FIELD_TYPES[t]}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FieldCard({
  field,
  open,
  onToggle,
  onChange,
  onRemove,
  onDuplicate,
  keyFor,
}: {
  field: FormField;
  open: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<FormField>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  keyFor: (label: string) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const [keyTouched, setKeyTouched] = useState(false);
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={cn("rounded-xl border bg-white", open ? "border-brand-300 shadow" : "border-line", isDragging && "z-10 opacity-80 shadow-lg")}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button type="button" {...attributes} {...listeners} className="cursor-grab px-1 text-muted-foreground/70 hover:text-muted-foreground" aria-label="Seret untuk mengurutkan">
          ⋮⋮
        </button>
        <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-600"> *</span>}
          </span>
          <span className="text-xs text-muted-foreground">
            {FIELD_TYPES[field.type]} · <span className="font-mono">{`{{${field.key}}}`}</span>
          </span>
        </button>
        <button type="button" onClick={onDuplicate} className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-cream">
          Duplikat
        </button>
        <button
          type="button"
          onClick={() => confirm(`Hapus "${field.label}"?`) && onRemove()}
          className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
        >
          Hapus
        </button>
      </div>

      {open && (
        <div className="grid gap-4 border-t border-line p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Pertanyaan / label</Label>
            <Input
              value={field.label}
              onChange={(e) => onChange(keyTouched ? { label: e.target.value } : { label: e.target.value, key: keyFor(e.target.value) })}
            />
          </div>
          <div>
            <Label>Tipe</Label>
            <Select
              value={field.type}
              onChange={(e) => {
                const type = e.target.value as FieldType;
                onChange({ type, ...typeDefaults(type, field) });
              }}
            >
              {(Object.keys(FIELD_TYPES) as FieldType[]).map((t) => (
                <option key={t} value={t}>
                  {FIELD_TYPES[t]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Key (untuk template)</Label>
            <Input
              value={field.key}
              className="font-mono"
              onChange={(e) => {
                setKeyTouched(true);
                onChange({ key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") });
              }}
            />
          </div>
          <div>
            <Label>Placeholder</Label>
            <Input value={field.placeholder ?? ""} onChange={(e) => onChange({ placeholder: e.target.value || undefined })} />
          </div>
          <div>
            <Label>Keterangan tambahan</Label>
            <Input value={field.help ?? ""} onChange={(e) => onChange({ help: e.target.value || undefined })} />
          </div>
          {hasOptions(field.type) && (
            <div className="sm:col-span-2">
              <Label>Opsi (satu per baris)</Label>
              <Textarea
                rows={4}
                value={(field.options ?? []).join("\n")}
                onChange={(e) => onChange({ options: e.target.value.split("\n") })}
                onBlur={(e) => onChange({ options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
              />
            </div>
          )}
          {field.type === "slot" && <SlotsEditor slots={field.slots ?? []} onChange={(slots) => onChange({ slots })} />}
          {field.type === "guests" && (
            <div className="sm:col-span-2">
              <Label>Maksimal teman per pendaftar</Label>
              <Input type="number" min={1} max={10} className="w-32" value={field.max_guests ?? 1} onChange={(e) => onChange({ max_guests: Number(e.target.value) || 1 })} />
              <p className="mt-1 text-xs text-muted-foreground">Total teman per jadwal dibatasi oleh &quot;Kuota teman&quot; di field Jadwal berkuota.</p>
            </div>
          )}
          {field.type === "guests" && <GuestFieldsEditor fields={guestSubFields(field)} onChange={(guest_fields) => onChange({ guest_fields })} />}
          {(field.type === "select" || field.type === "radio") && (
            <OptionWaEditor options={field.options ?? []} value={field.option_wa} onChange={(option_wa) => onChange({ option_wa })} />
          )}
          {field.type === "file" && (
            <p className="rounded-xl bg-sun-50 p-3 text-xs text-sun-700 ring-1 ring-sun-200 sm:col-span-2">
              File (JPG/PNG/WebP/PDF, maks 5 MB) disimpan privat dan hanya bisa dibuka admin dari halaman Pendaftar. Pendaftar otomatis berstatus pembayaran &quot;Menunggu&quot;.
            </p>
          )}
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={field.required} onChange={(e) => onChange({ required: e.target.checked })} className="h-4 w-4 accent-brand-600" />
            Wajib diisi
          </label>
        </div>
      )}
    </div>
  );
}

/** Nilai bawaan saat tipe field dipilih. */
function typeDefaults(type: FieldType, prev?: FormField): Partial<FormField> {
  return {
    options: hasOptions(type) ? (prev?.options?.length ? prev.options : ["Opsi 1", "Opsi 2"]) : undefined,
    slots: type === "slot" ? (prev?.slots?.length ? prev.slots : [newSlot(1), newSlot(2)]) : undefined,
    max_guests: type === "guests" ? (prev?.max_guests ?? 1) : undefined,
    guest_fields: type === "guests" ? (prev?.guest_fields ?? DEFAULT_GUEST_FIELDS) : undefined,
    required: type === "slot" ? true : (prev?.required ?? false),
  };
}

export function SlotsEditor({ slots, onChange, usage, bare }: { slots: Slot[]; onChange: (s: Slot[]) => void; usage?: SlotUsage; bare?: boolean }) {
  const update = (i: number, patch: Partial<Slot>) => onChange(slots.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const total = slots.reduce((a, s) => a + (Number(s.quota) || 0), 0);
  const totalGuests = slots.reduce((a, s) => a + (Number(s.guest_quota) || 0), 0);
  return (
    <div className="sm:col-span-2">
      {!bare && <Label>Daftar jadwal & kuota</Label>}
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="hidden grid-cols-[1fr_110px_110px_40px] gap-2 bg-cream px-3 py-2 text-xs font-semibold text-muted-foreground sm:grid">
          <span>Nama jadwal (tampil ke pendaftar)</span>
          <span>Kuota peserta</span>
          <span>Kuota teman</span>
          <span />
        </div>
        {slots.map((s, i) => (
          <div key={s.id} className="grid grid-cols-2 gap-2 border-t border-line p-3 first:border-t-0 sm:grid-cols-[1fr_110px_110px_40px] sm:first:border-t">
            <Input className="col-span-2 sm:col-span-1" value={s.label} placeholder="LS 1-2 (13.00–14.00)" onChange={(e) => update(i, { label: e.target.value })} />
            <div>
              <span className="mb-1 block text-xs text-muted-foreground sm:hidden">Kuota peserta</span>
              <Input type="number" min={0} value={s.quota} aria-label="Kuota peserta" onChange={(e) => update(i, { quota: Number(e.target.value) })} />
              {usage && <span className="mt-1 block text-[11px] text-muted-foreground">terisi {usage[s.id]?.used ?? 0}</span>}
            </div>
            <div>
              <span className="mb-1 block text-xs text-muted-foreground sm:hidden">Kuota teman</span>
              <Input type="number" min={0} value={s.guest_quota} aria-label="Kuota teman" onChange={(e) => update(i, { guest_quota: Number(e.target.value) })} />
              {usage && <span className="mt-1 block text-[11px] text-muted-foreground">terisi {usage[s.id]?.guests ?? 0}</span>}
            </div>
            <button
              type="button"
              onClick={() => slots.length > 1 && confirm(`Hapus jadwal "${s.label}"?`) && onChange(slots.filter((_, j) => j !== i))}
              className="rounded-lg text-sm text-[#c20048] hover:bg-berry-500/10 disabled:opacity-30"
              disabled={slots.length <= 1}
              aria-label="Hapus jadwal"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="secondary" onClick={() => onChange([...slots, newSlot(slots.length + 1)])}>
          + Tambah jadwal
        </Button>
        <p className="text-xs text-muted-foreground">
          Total: <b>{total}</b> peserta + <b>{totalGuests}</b> teman. Kuota sesi otomatis mengikuti total peserta.
        </p>
      </div>
    </div>
  );
}

const GUEST_TYPES: Record<GuestSubField["type"], string> = { short_text: "Teks", phone: "No. HP", number: "Angka" };

function GuestFieldsEditor({ fields, onChange }: { fields: GuestSubField[]; onChange: (f: GuestSubField[]) => void }) {
  const update = (i: number, patch: Partial<GuestSubField>) => onChange(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  return (
    <div className="sm:col-span-2">
      <Label>Kolom isian untuk tiap teman</Label>
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={i} className="grid grid-cols-2 items-center gap-2 rounded-xl border border-line bg-white p-2 sm:grid-cols-[1fr_130px_110px_auto_32px]">
            <Input
              className="col-span-2 sm:col-span-1"
              value={f.label}
              placeholder="Label, mis. Nama teman"
              onChange={(e) => update(i, { label: e.target.value, key: slugifyKey(e.target.value) || f.key })}
            />
            <Input value={f.placeholder ?? ""} placeholder="Placeholder" onChange={(e) => update(i, { placeholder: e.target.value || undefined })} />
            <Select value={f.type} onChange={(e) => update(i, { type: e.target.value as GuestSubField["type"] })}>
              {Object.entries(GUEST_TYPES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <label className="flex items-center gap-1.5 whitespace-nowrap text-xs">
              <input type="checkbox" checked={f.required} onChange={(e) => update(i, { required: e.target.checked })} className="accent-brand-600" /> Wajib
            </label>
            <button
              type="button"
              disabled={fields.length <= 1}
              onClick={() => onChange(fields.filter((_, j) => j !== i))}
              className="rounded-lg text-sm text-[#c20048] hover:bg-berry-500/10 disabled:opacity-30"
              aria-label="Hapus kolom"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        className="mt-2"
        onClick={() => onChange([...fields, { key: `kolom_${fields.length + 1}`, label: `Kolom ${fields.length + 1}`, type: "short_text", required: false }])}
      >
        + Tambah kolom
      </Button>
    </div>
  );
}

function OptionWaEditor({ options, value, onChange }: { options: string[]; value?: Record<string, string>; onChange: (v: Record<string, string> | undefined) => void }) {
  const enabled = value !== undefined;
  const opts = options.map((o) => o.trim()).filter(Boolean);
  return (
    <div className="sm:col-span-2">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} onChange={(e) => onChange(e.target.checked ? {} : undefined)} className="h-4 w-4 accent-brand-600" />
        Tiap opsi punya No. WhatsApp (tombol konfirmasi pembayaran mengarah ke opsi yang dipilih)
      </label>
      {enabled && (
        <div className="mt-2 space-y-2">
          {opts.map((o) => (
            <div key={o} className="grid grid-cols-[1fr_1fr] items-center gap-2">
              <span className="truncate text-sm font-medium">{o}</span>
              <Input value={value?.[o] ?? ""} placeholder="08xxxxxxxxxx" inputMode="tel" onChange={(e) => onChange({ ...value, [o]: e.target.value })} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
