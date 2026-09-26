import Image from "next/image";
import Link from "next/link";
import { fmtEventDate, priceLabel, type Promo } from "@/lib/promo";
import { slotField } from "@/lib/form-schema";
import { sessionAvailability, type Session, type SlotUsage } from "@/lib/types";
import { ShootingStar, Sparkle, Star } from "./brand";
import { Badge, QuotaBar, buttonClass, cn } from "./kit";

/** Label harga berbentuk ledakan bintang seperti di poster. */
export function PriceBurst({
  price,
  unit,
  prefix,
  className,
  tone = "sun",
}: {
  price: string;
  unit?: string;
  prefix?: string;
  className?: string;
  tone?: "sun" | "brand";
}) {
  const pts = Array.from({ length: 28 }, (_, i) => {
    const r = i % 2 === 0 ? 50 : 42;
    const a = (Math.PI * 2 * i) / 28 - Math.PI / 2;
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  }).join(" ");
  return (
    <div className={cn("relative grid aspect-square place-items-center", className)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full drop-shadow-md" aria-hidden>
        <polygon points={pts} fill={tone === "sun" ? "var(--color-sun-400)" : "var(--color-brand-600)"} stroke="var(--color-brand-800)" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <div className={cn("relative -rotate-6 text-center leading-none", tone === "sun" ? "text-brand-900" : "text-white")}>
        {prefix && <span className="block text-[0.6em] font-semibold">{prefix}</span>}
        <span className="block text-[1.5em] font-extrabold tracking-tight">{price}</span>
        {unit && <span className="block text-[0.6em] font-bold">{unit}</span>}
      </div>
    </div>
  );
}

function InfoIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
const ICON = {
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  calendar: "M8 3v4M16 3v4M3 10h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
  pin: "M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  kid: "M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 22v-6l-2-4 5-2h6l5 2-2 4v6",
};

/** Kartu Waktu / Tanggal / Lokasi. */
export function EventFacts({ promo, compact }: { promo: Promo; compact?: boolean }) {
  const facts = [
    promo.event_date && { icon: ICON.calendar, label: "Tanggal", value: fmtEventDate(promo.event_date) },
    (promo.event_time || promo.age_range) && {
      icon: ICON.clock,
      label: "Waktu",
      value: [promo.event_time, promo.age_range && `usia ${promo.age_range}`].filter(Boolean).join(" · "),
    },
    promo.location_name && {
      icon: ICON.pin,
      label: "Lokasi",
      value: promo.location_name,
      sub: promo.location_address,
      href: promo.maps_url,
    },
  ].filter(Boolean) as { icon: string; label: string; value: string; sub?: string; href?: string }[];
  if (!facts.length) return null;

  return (
    <dl className={cn("grid gap-3", !compact && "sm:grid-cols-1")}>
      {facts.map((f) => (
        <div key={f.label} className="flex gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-line">
          <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-700">
            <InfoIcon d={f.icon} />
          </span>
          <div className="min-w-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-brand-700">{f.label}</dt>
            <dd className="font-semibold text-ink">{f.value}</dd>
            {f.sub && <dd className="text-sm text-muted-foreground">{f.sub}</dd>}
            {f.href && (
              <dd>
                <a href={f.href} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand-700 hover:underline">
                  Lihat peta ↗
                </a>
              </dd>
            )}
          </div>
        </div>
      ))}
    </dl>
  );
}

/** Pita hijau "Yang kamu dapat" seperti di poster. */
export function IncludesRibbon({ promo }: { promo: Promo }) {
  if (!promo.includes?.length) return null;
  return (
    <div className="relative overflow-hidden rounded-leaf bg-brand-800 p-6 text-white">
      <Sparkle className="absolute right-4 top-4 h-5 w-5 text-sun-300" />
      {promo.includes_title && <p className="inline-block rounded-full bg-cream px-3 py-1 text-sm font-bold text-brand-800">{promo.includes_title}</p>}
      <ul className="mt-4 space-y-2">
        {promo.includes.map((i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <Star className="mt-0.5 h-4 w-4 shrink-0" />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PromoDeal({ promo }: { promo: Promo }) {
  if (!promo.promo_price && !promo.promo_text) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-sun-100 p-3.5 ring-1 ring-sun-300">
      <Star className="h-8 w-8 shrink-0 animate-twinkle" />
      <div className="text-sm">
        {promo.promo_text && <p className="font-bold text-ink">{promo.promo_text}</p>}
        {promo.promo_price && (
          <p className="text-sun-700">
            <b className="text-ink">{promo.promo_price}</b> {promo.promo_unit}
          </p>
        )}
      </div>
    </div>
  );
}

const CLOSED_LABEL = { draft: "Draft", closed: "Ditutup", not_open: "Segera dibuka", ended: "Berakhir", full: "Kuota penuh" };

/** Kartu sesi di landing page. */
export function SessionCard({ session, used, featured, usage = {} }: { session: Session; used: number; featured?: boolean; usage?: SlotUsage }) {
  const promo = session.promo ?? {};
  const slots = slotField(session.fields)?.slots ?? [];
  const av = sessionAvailability(session, used);
  return (
    <article className={cn("group relative flex flex-col overflow-hidden rounded-leaf border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-900/5", featured && "md:flex-row")}>
      <Link href={`/s/${session.slug}`} className={cn("relative block overflow-hidden bg-sun-50", featured ? "md:w-[46%]" : "")}>
        {promo.poster_url ? (
          <Image
            src={promo.poster_url}
            alt={`Poster ${session.title}`}
            width={800}
            height={1000}
            sizes={featured ? "(min-width: 768px) 500px, 100vw" : "(min-width: 768px) 360px, 100vw"}
            className={cn("h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]", featured ? "aspect-[4/5] md:aspect-auto" : "aspect-[4/5]")}
          />
        ) : (
          <div className="relative flex aspect-[4/5] h-full items-center justify-center bg-gradient-to-br from-sun-100 via-cream to-brand-50">
            <ShootingStar className="h-28 w-28" />
          </div>
        )}
        {priceLabel(promo) && (
          <PriceBurst
            price={priceLabel(promo)}
            unit={promo.price_unit}
            prefix={promo.price_prefix}
            className="absolute -bottom-2 left-2 w-24 text-[13px] sm:w-28 sm:text-[15px]"
          />
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          {av.open ? <Badge color="green">● Pendaftaran dibuka</Badge> : <Badge color={av.reason === "not_open" ? "yellow" : "red"}>{CLOSED_LABEL[av.reason]}</Badge>}
          {promo.partner && <Badge color="blue">bersama {promo.partner}</Badge>}
        </div>
        <div>
          <h3 className={cn("font-extrabold leading-tight tracking-tight text-ink", featured ? "text-3xl" : "text-xl")}>
            <Link href={`/s/${session.slug}`} className="hover:text-brand-700">
              {session.title}
            </Link>
          </h3>
          {promo.subtitle && <p className="mt-1 font-semibold text-leaf-500">{promo.subtitle}</p>}
        </div>

        {featured ? (
          <>
            <EventFacts promo={promo} />
            <PromoDeal promo={promo} />
          </>
        ) : (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {promo.event_date && <li>📅 {fmtEventDate(promo.event_date)}</li>}
            {(promo.event_time || promo.age_range) && <li>⏰ {[promo.event_time, promo.age_range && `usia ${promo.age_range}`].filter(Boolean).join(" · ")}</li>}
            {promo.location_name && <li>📍 {promo.location_name}</li>}
          </ul>
        )}

        {slots.length > 0 && (
          <ul className="space-y-1.5">
            {slots.map((sl) => {
              const left = Math.max(0, sl.quota - (usage[sl.id]?.used ?? 0));
              return (
                <li key={sl.id} className="flex items-center justify-between gap-3 rounded-xl bg-cream px-3 py-2 text-sm">
                  <span className="min-w-0 truncate font-medium text-ink">{sl.label}</span>
                  <span className={cn("shrink-0 text-xs font-bold", left === 0 ? "text-berry-500" : left <= 3 ? "text-sun-700" : "text-brand-700")}>
                    {left === 0 ? "Penuh" : `Sisa ${left}`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-auto space-y-3 pt-2">
          <div>
            <div className="mb-1.5 flex justify-between text-xs font-medium text-muted-foreground">
              <span>
                {used}/{session.quota} terisi
              </span>
              <span className={cn("font-bold", av.remaining <= 5 ? "text-berry-500" : "text-brand-700")}>Sisa {av.remaining} kursi</span>
            </div>
            <QuotaBar used={used} quota={session.quota} />
          </div>
          <Link href={`/s/${session.slug}`} className={buttonClass(av.open ? "primary" : "secondary", "w-full")}>
            {av.open ? "Daftar sekarang →" : "Lihat detail"}
          </Link>
        </div>
      </div>
    </article>
  );
}
