import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Blok abu-krem dengan kilau berjalan. */
export function Bone({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div aria-hidden className={cn("shimmer rounded-xl", className)} style={style} />;
}

/** Muncul bertahap: tiap anak diberi jeda kecil. */
const delay = (i: number): CSSProperties => ({ animationDelay: `${i * 70}ms` });

/** Bintang Sparks yang berputar pelan + teks memuat. */
export function StarLoader({ label = "Memuat…", className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex items-center gap-3 text-sm font-medium text-muted-foreground", className)}>
      <span className="relative grid size-9 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-sun-300/40 [animation-duration:1.8s]" />
        <svg viewBox="0 0 24 24" className="relative size-6 animate-star-orbit drop-shadow-[0_2px_6px_rgba(255,205,0,0.6)]">
          <path d="M12 1.8l2.95 6.3 6.85.8-5.07 4.7 1.36 6.8L12 17l-6.09 3.4 1.36-6.8L2.2 8.9l6.85-.8L12 1.8z" fill="#FFCD00" />
        </svg>
      </span>
      {label}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <main aria-busy className="mx-auto max-w-6xl px-4">
      <div className="grid items-center gap-12 pb-20 pt-12 md:grid-cols-[1.1fr_0.9fr] md:pt-20">
        <div className="space-y-5">
          <Bone className="h-7 w-56 animate-rise rounded-full" style={delay(0)} />
          <Bone className="h-14 w-11/12 animate-rise" style={delay(1)} />
          <Bone className="h-14 w-3/4 animate-rise" style={delay(2)} />
          <Bone className="h-5 w-full animate-rise" style={delay(3)} />
          <Bone className="h-5 w-5/6 animate-rise" style={delay(4)} />
          <div className="flex gap-3 pt-3">
            <Bone className="h-12 w-44 animate-rise rounded-full" style={delay(5)} />
            <Bone className="h-12 w-40 animate-rise rounded-full" style={delay(6)} />
          </div>
          <div className="grid max-w-xl grid-cols-3 gap-3 pt-6">
            {[0, 1, 2].map((i) => (
              <Bone key={i} className="h-20 animate-rise rounded-2xl" style={delay(7 + i)} />
            ))}
          </div>
        </div>
        <Bone className="aspect-[4/5] w-full max-w-sm animate-rise justify-self-center rounded-leaf md:max-w-none" style={delay(2)} />
      </div>
      <div className="flex justify-center pb-16">
        <StarLoader label="Menyiapkan sesi…" />
      </div>
    </main>
  );
}

export function SessionSkeleton() {
  return (
    <main aria-busy className="mx-auto max-w-6xl px-4 py-10">
      <Bone className="h-4 w-28 animate-rise" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="space-y-4">
          <Bone className="aspect-[4/5] w-full animate-rise rounded-leaf" style={delay(1)} />
          {[0, 1, 2].map((i) => (
            <Bone key={i} className="h-16 animate-rise rounded-2xl" style={delay(2 + i)} />
          ))}
        </div>
        <div className="space-y-5">
          <Bone className="h-6 w-40 animate-rise rounded-full" style={delay(1)} />
          <Bone className="h-10 w-4/5 animate-rise" style={delay(2)} />
          <Bone className="h-5 w-2/3 animate-rise" style={delay(3)} />
          <Bone className="h-20 animate-rise rounded-2xl" style={delay(4)} />
          <div className="space-y-5 rounded-leaf border border-line bg-white p-6 sm:p-8">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Bone className="h-4 w-36 animate-rise" style={delay(5 + i)} />
                <Bone className="h-11 animate-rise" style={delay(5 + i)} />
              </div>
            ))}
            <StarLoader label="Memuat formulir…" />
          </div>
        </div>
      </div>
    </main>
  );
}

export function CardSkeleton({ label = "Memuat…" }: { label?: string }) {
  return (
    <main aria-busy className="mx-auto max-w-2xl px-4 py-12">
      <div className="space-y-4 rounded-leaf border border-line bg-white p-6 sm:p-8">
        <Bone className="h-8 w-48 animate-rise" />
        <Bone className="h-4 w-3/4 animate-rise" style={delay(1)} />
        {[0, 1, 2].map((i) => (
          <Bone key={i} className="h-11 animate-rise" style={delay(2 + i)} />
        ))}
        <StarLoader label={label} className="pt-2" />
      </div>
    </main>
  );
}

/** Skeleton konten admin (sidebar tetap tampil karena ada di layout). */
export function AdminSkeleton() {
  return (
    <div aria-busy>
      <div className="flex h-14 items-center gap-3 border-b px-4">
        <Bone className="size-7 rounded-md" />
        <Bone className="h-4 w-48" />
      </div>
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <Bone className="h-8 w-48 animate-rise" />
            <Bone className="h-4 w-72 animate-rise" style={delay(1)} />
          </div>
          <Bone className="h-9 w-32 animate-rise rounded-lg" style={delay(2)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} className="h-28 animate-rise rounded-2xl" style={delay(2 + i)} />
          ))}
        </div>
        <div className="space-y-3 rounded-2xl border bg-card p-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Bone key={i} className="h-10 animate-rise rounded-lg" style={delay(5 + i)} />
          ))}
        </div>
        <div className="flex justify-center">
          <StarLoader />
        </div>
      </div>
    </div>
  );
}
