"use client";

import { useState } from "react";

/** Teks dengan tombol salin kecil, dipakai untuk penanda [[...]] di pesan penutup. */
export function CopyText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
      }
      className="inline-flex items-center gap-1.5 rounded-lg bg-sun-100 px-2 py-0.5 align-baseline font-mono font-bold text-ink ring-1 ring-sun-300 transition hover:bg-sun-200"
      title="Klik untuk menyalin"
    >
      {text}
      <span className="font-sans text-[11px] font-semibold text-sun-700">{copied ? "✓ tersalin" : "salin"}</span>
    </button>
  );
}

/** Render teks biasa dengan potongan [[...]] sebagai tombol salin. */
export function RichMessage({ parts, className }: { parts: { copy: boolean; text: string }[]; className?: string }) {
  return (
    <p className={className}>
      {parts.map((p, i) => (p.copy ? <CopyText key={i} text={p.text} /> : <span key={i}>{p.text}</span>))}
    </p>
  );
}
