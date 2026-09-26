import Link from "next/link";
import { SITE } from "@/lib/site";
import { Logo, ShootingStar, Sparkle } from "./brand";
import { buttonClass } from "./kit";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Logo />
        <span className="hidden rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 sm:inline">{SITE.branch}</span>
        <nav className="ml-auto flex items-center gap-1 text-sm font-medium sm:gap-2">
          <Link href="/#sesi" className="hidden rounded-full px-3 py-2 text-ink hover:bg-brand-50 sm:inline">
            Sesi
          </Link>
          <Link href="/#cara-daftar" className="hidden rounded-full px-3 py-2 text-ink hover:bg-brand-50 md:inline">
            Cara daftar
          </Link>
          <Link href="/cek" className={buttonClass("secondary", "px-4 py-2")}>
            Cek pendaftaran
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-brand-800 text-brand-50">
      <ShootingStar className="absolute -top-2 right-6 h-24 w-24 opacity-30" />
      <Sparkle className="absolute bottom-10 left-[45%] h-4 w-4 text-sun-300/50" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <p className="text-xl font-bold text-white">
            Sparks<span className="text-sun-300">English</span> <span className="font-medium text-brand-200">{SITE.branch}</span>
          </p>
          <p className="mt-3 text-sm text-brand-100/80">{SITE.tagline}</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-white">Lokasi</p>
          <p className="mt-2 text-brand-100/80">{SITE.address}</p>
          <a href={SITE.mapsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block font-semibold text-sun-300 hover:underline">
            Buka di Google Maps ↗
          </a>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-white">Tautan</p>
          <ul className="mt-2 space-y-1.5 text-brand-100/80">
            <li><Link href="/#sesi" className="hover:text-white">Sesi yang dibuka</Link></li>
            <li><Link href="/cek" className="hover:text-white">Cek pendaftaran</Link></li>
            <li><a href={SITE.websiteUrl} target="_blank" rel="noreferrer" className="hover:text-white">sparks-edu.com ↗</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-brand-100/60">© {new Date().getFullYear()} {SITE.brand} {SITE.branch}</div>
    </footer>
  );
}
