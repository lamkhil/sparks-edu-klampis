"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const UNITS = [
  { label: "hari", ms: 86_400_000, mod: Infinity },
  { label: "jam", ms: 3_600_000, mod: 24 },
  { label: "menit", ms: 60_000, mod: 60 },
  { label: "detik", ms: 1_000, mod: 60 },
];

/** Hitung mundur sampai pendaftaran dibuka; halaman di-refresh begitu waktunya tiba. */
export function OpenCountdown({ opensAt }: { opensAt: string }) {
  const router = useRouter();
  const target = new Date(opensAt).getTime();
  // null sampai ter-mount agar tidak terjadi hydration mismatch.
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const ms = target - Date.now();
      setLeft(Math.max(0, ms));
      // Refresh saat waktunya tiba, lalu ulangi tiap 5 detik bila jam server sedikit tertinggal.
      if (ms <= 0 && Math.floor(-ms / 1000) % 5 === 0) router.refresh();
    };
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [target, router]);

  const parts = UNITS.map((u) => ({
    label: u.label,
    value: Math.floor((left ?? 0) / u.ms) % u.mod,
  }));

  return (
    <div className="rounded-2xl border border-sun-300 bg-sun-50 px-4 py-5 text-center">
      <p className="text-sm font-semibold text-sun-700">Pendaftaran dibuka dalam</p>
      <div className="mt-3 flex justify-center gap-2 sm:gap-3" role="timer" aria-live="off">
        {parts.map((p) => (
          <div key={p.label} className="min-w-16 rounded-xl bg-white px-2 py-2 ring-1 ring-sun-300">
            <div className="text-2xl font-extrabold tabular-nums text-ink sm:text-3xl">
              {left === null ? "--" : String(p.value).padStart(2, "0")}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{p.label}</div>
          </div>
        ))}
      </div>
      {left === 0 && <p className="mt-3 text-sm font-semibold text-brand-700">Membuka formulir…</p>}
    </div>
  );
}
