"use client";

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { FieldBlock } from "@/components/dynamic-form";
import { Button, Input, Label, Select, Textarea, cn } from "@/components/ui";
import { FIELD_TYPES, hasOptions, slugifyKey, type FieldType, type FormField } from "@/lib/form-schema";

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
      options: hasOptions(type) ? ["Opsi 1", "Opsi 2"] : undefined,
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
        <p className="text-sm text-gray-600">Seret ⋮⋮ untuk mengurutkan. Wajib ada tepat satu field Email (untuk konfirmasi & cek ulang).</p>
        <Button type="button" variant="secondary" onClick={() => setPreview((p) => !p)}>
          {preview ? "Kembali ke editor" : "Pratinjau"}
        </Button>
      </div>

      {preview ? (
        <div className="space-y-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6">
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

          <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-4">
            <p className="mb-2 text-xs font-medium uppercase text-gray-500">Tambah pertanyaan</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(FIELD_TYPES) as FieldType[]).map((t) => (
                <button key={t} type="button" onClick={() => add(t)} className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm hover:border-indigo-400 hover:text-indigo-700">
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
    <div ref={setNodeRef} style={style} className={cn("rounded-xl border bg-white", open ? "border-indigo-300 shadow" : "border-gray-200", isDragging && "z-10 opacity-80 shadow-lg")}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button type="button" {...attributes} {...listeners} className="cursor-grab px-1 text-gray-400 hover:text-gray-700" aria-label="Seret untuk mengurutkan">
          ⋮⋮
        </button>
        <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-600"> *</span>}
          </span>
          <span className="text-xs text-gray-500">
            {FIELD_TYPES[field.type]} · <span className="font-mono">{`{{${field.key}}}`}</span>
          </span>
        </button>
        <button type="button" onClick={onDuplicate} className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100">
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
        <div className="grid gap-4 border-t border-gray-100 p-4 sm:grid-cols-2">
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
                onChange({ type, options: hasOptions(type) ? (field.options?.length ? field.options : ["Opsi 1"]) : undefined });
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
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={field.required} onChange={(e) => onChange({ required: e.target.checked })} className="h-4 w-4 accent-indigo-600" />
            Wajib diisi
          </label>
        </div>
      )}
    </div>
  );
}
