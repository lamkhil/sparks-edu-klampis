import { cn } from "@/lib/utils";

const SPARKLES = [
  { x: "8%", y: "18%", size: 12, color: "var(--color-leaf-400)", delay: "0s" },
  { x: "86%", y: "10%", size: 10, color: "var(--color-sun-300)", delay: "0.5s" },
  { x: "92%", y: "70%", size: 14, color: "var(--color-brand-400)", delay: "0.9s" },
  { x: "4%", y: "78%", size: 9, color: "var(--color-sun-400)", delay: "1.3s" },
];

/** Loader premium: bintang jatuh Sparks di tengah, tanpa kotak skeleton. */
export function StarLoader({ label = "Memuat…", className, compact }: { label?: string; className?: string; compact?: boolean }) {
  return (
    <div role="status" aria-live="polite" className={cn("star-loader grid place-items-center", compact ? "min-h-[50vh]" : "min-h-[70vh]", className)}>
      <div className="flex flex-col items-center gap-5">
        <div className="relative size-36">
          {/* cahaya lembut */}
          <div className="star-loader__glow absolute inset-4 rounded-full bg-[radial-gradient(circle,rgba(255,205,0,0.55)_0%,rgba(0,174,126,0.18)_45%,transparent_70%)] blur-md" />
          {/* kilau kecil */}
          {SPARKLES.map((s, i) => (
            <svg
              key={i}
              viewBox="0 0 24 24"
              className="star-loader__sparkle absolute"
              style={{ left: s.x, top: s.y, width: s.size, height: s.size, animationDelay: s.delay }}
              aria-hidden
            >
              <path d="M12 0c.8 6.4 5.6 11.2 12 12-6.4.8-11.2 5.6-12 12-.8-6.4-5.6-11.2-12-12C6.4 11.2 11.2 6.4 12 0z" fill={s.color} />
            </svg>
          ))}
          {/* bintang jatuh */}
          <svg viewBox="0 0 64 64" className="relative size-full drop-shadow-[0_6px_14px_rgba(255,180,0,0.45)]" aria-hidden>
            <g stroke="var(--color-sun-400)" strokeWidth="4" strokeLinecap="round" fill="none">
              <path className="star-loader__trail" d="M8 44 L24 28" style={{ animationDelay: "0s" }} />
              <path className="star-loader__trail" d="M14 53 L30 37" style={{ animationDelay: "0.18s" }} opacity=".8" />
              <path className="star-loader__trail" d="M25 57 L37 45" style={{ animationDelay: "0.36s" }} opacity=".6" />
            </g>
            <path
              className="star-loader__star"
              d="M44 4l3.9 8.3 9.1 1-6.7 6.3 1.8 9L44 24.1l-8.1 4.5 1.8-9-6.7-6.3 9.1-1L44 4z"
              fill="var(--color-sun-400)"
              stroke="#f5b800"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-sm font-semibold tracking-wide text-brand-800/80">{label}</p>
      </div>
    </div>
  );
}
