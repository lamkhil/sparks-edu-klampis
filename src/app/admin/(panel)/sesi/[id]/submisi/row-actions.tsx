"use client";

import { useState, useTransition } from "react";
import { formatAnswer, type FormField } from "@/lib/form-schema";
import type { Submission } from "@/lib/types";
import { deleteSubmission, resendEmail, setSubmissionStatus } from "../../actions";

export function RowActions({ sub, fields }: { sub: Submission; fields: FormField[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? okMsg : (r.error ?? "Gagal"));
    });

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-indigo-600 hover:underline">
        Detail
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 text-left text-gray-900" onClick={() => setOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="font-mono text-lg font-bold">{sub.code}</h2>
                <p className="text-xs text-gray-500">{sub.status === "active" ? "Aktif" : "Dibatalkan"}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700">
                ✕
              </button>
            </div>
            <dl className="divide-y divide-gray-100 text-sm">
              {fields.map((f) => (
                <div key={f.id} className="grid grid-cols-3 gap-2 py-2">
                  <dt className="text-gray-500">{f.label}</dt>
                  <dd className="col-span-2 whitespace-pre-line">{formatAnswer(sub.answers[f.key]) || "-"}</dd>
                </div>
              ))}
            </dl>
            {sub.email_error && <p className="mt-3 rounded bg-red-50 p-2 text-xs text-red-700">Error email: {sub.email_error}</p>}
            {msg && <p className="mt-3 rounded bg-gray-100 p-2 text-sm">{msg}</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              <button disabled={pending} onClick={() => run(() => resendEmail(sub.id), "Email terkirim.")} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
                Kirim ulang email
              </button>
              {sub.status === "active" ? (
                <button
                  disabled={pending}
                  onClick={() => confirm("Batalkan isian ini? Slot kuota akan dilepas.") && run(() => setSubmissionStatus(sub.id, "cancelled"), "Dibatalkan.")}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Batalkan
                </button>
              ) : (
                <button disabled={pending} onClick={() => run(() => setSubmissionStatus(sub.id, "active"), "Dipulihkan.")} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
                  Pulihkan
                </button>
              )}
              <button
                disabled={pending}
                onClick={() => confirm("Hapus permanen isian ini?") && run(() => deleteSubmission(sub.id), "Dihapus.")}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
