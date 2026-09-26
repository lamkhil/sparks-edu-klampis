"use client";

import { useState } from "react";

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(code).then(() => setCopied(true))}
      className="mt-1 font-mono text-3xl font-bold tracking-widest text-brand-800"
      title="Salin kode"
    >
      {code}
      <span className="ml-2 align-middle text-xs font-normal tracking-normal text-sun-700">{copied ? "tersalin" : "salin"}</span>
    </button>
  );
}
