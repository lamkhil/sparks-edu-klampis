import Image from "next/image";
import Link from "next/link";
import { cn } from "./kit";

export function Logo({ className, href = "/", src, alt }: { className?: string; href?: string; src: string; alt: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center", className)} aria-label={`${alt} — beranda`}>
      <Image src={src} alt={alt} width={500} height={100} priority className="h-8 w-auto sm:h-9" />
    </Link>
  );
}

/** Bintang lima sudut kuning seperti di logo Sparks. */
export function Star({ className, color = "var(--color-sun-400)" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M12 1.8l2.95 6.3 6.85.8-5.07 4.7 1.36 6.8L12 17l-6.09 3.4 1.36-6.8L2.2 8.9l6.85-.8L12 1.8z"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Bintang jatuh dengan tiga garis ekor — ornamen utama. */
export function ShootingStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className}>
      <g stroke="var(--color-sun-400)" strokeWidth="4" strokeLinecap="round">
        <path d="M6 40 L24 22" />
        <path d="M12 50 L30 32" opacity=".8" />
        <path d="M22 56 L36 42" opacity=".6" />
      </g>
      <path d="M44 4l3.9 8.3 9.1 1-6.7 6.3 1.8 9L44 24.1l-8.1 4.5 1.8-9-6.7-6.3 9.1-1L44 4z" fill="var(--color-sun-400)" />
    </svg>
  );
}

/** Kilau kecil 4 sudut. */
export function Sparkle({ className, color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path d="M12 0c.8 6.4 5.6 11.2 12 12-6.4.8-11.2 5.6-12 12-.8-6.4-5.6-11.2-12-12C6.4 11.2 11.2 6.4 12 0z" fill={color} />
    </svg>
  );
}

/** Garis bergelombang untuk aksen di bawah judul. */
export function Squiggle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden className={className}>
      <path d="M2 8c10-6 18-6 28 0s18 6 28 0 18-6 28 0 18 6 28 0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Pola titik latar yang halus. */
export function DotGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute", className)}
      style={{ backgroundImage: "radial-gradient(var(--color-brand-200) 1.5px, transparent 1.5px)", backgroundSize: "18px 18px" }}
    />
  );
}
