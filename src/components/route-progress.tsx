"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Progress bar tipis di atas layar saat pindah halaman.
 * Mulai saat link internal diklik, merayap mendekati 90%, lalu menyelesaikan diri
 * begitu URL berubah (halaman baru sudah dirender).
 */
export function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    if (hide.current) clearTimeout(hide.current);
  }, []);

  const start = useCallback(() => {
    clear();
    setVisible(true);
    setProgress(8);
    // Merayap cepat di awal, makin pelan mendekati 90%.
    timer.current = setInterval(() => setProgress((p) => (p < 90 ? p + (90 - p) * 0.08 : p)), 120);
  }, [clear]);

  // Selesai saat URL berubah.
  useEffect(() => {
    if (!timer.current) return;
    clear();
    timer.current = null;
    setProgress(100);
    hide.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 380);
  }, [pathname, search, clear]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // hanya #hash
      start();
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clear();
    };
  }, [start, clear]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 300ms ease" }}
    >
      <div
        className="relative h-full rounded-r-full bg-gradient-to-r from-brand-500 via-leaf-400 to-sun-400 shadow-[0_0_12px_rgba(0,174,126,0.55)]"
        style={{ width: `${progress}%`, transition: progress === 0 ? "none" : "width 380ms cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        {/* Kilau bintang di ujung bar */}
        <svg viewBox="0 0 24 24" className="absolute -right-2 -top-[7px] h-4 w-4 drop-shadow-[0_0_6px_rgba(255,205,0,0.9)]">
          <path d="M12 1.8l2.95 6.3 6.85.8-5.07 4.7 1.36 6.8L12 17l-6.09 3.4 1.36-6.8L2.2 8.9l6.85-.8L12 1.8z" fill="#FFCD00" />
        </svg>
      </div>
    </div>
  );
}
