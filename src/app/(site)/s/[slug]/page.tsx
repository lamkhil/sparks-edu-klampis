import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShootingStar, Sparkle } from "@/components/brand";
import { DynamicForm } from "@/components/dynamic-form";
import {
  EventFacts,
  IncludesRibbon,
  PriceBurst,
  PromoDeal,
} from "@/components/session-promo";
import { Alert, Badge, QuotaBar } from "@/components/kit";
import { OpenCountdown } from "@/components/open-countdown";
import { priceLabel } from "@/lib/promo";
import { countActive, getSessionBySlug, slotUsage } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { sessionAvailability } from "@/lib/types";
import { createProofUpload, submitForm } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/s/[slug]">): Promise<Metadata> {
  const s = await getSessionBySlug((await params).slug);
  if (!s) return { title: "Sesi" };
  return {
    title: s.title,
    description: s.promo?.subtitle || s.description.slice(0, 160),
    openGraph: s.promo?.poster_url
      ? { images: [s.promo.poster_url] }
      : undefined,
  };
}

const REASONS = {
  draft: "Form ini belum dipublikasikan.",
  closed: "Pendaftaran sudah ditutup.",
  not_open: "Pendaftaran belum dibuka.",
  ended: "Pendaftaran sudah berakhir.",
  full: "Maaf, kuota sudah penuh.",
};

export default async function FormPage({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  const session = await getSessionBySlug(slug);
  if (!session || session.status === "draft") notFound();
  const [used, usage] = await Promise.all([countActive(session.id), slotUsage(session.id)]);
  const av = sessionAvailability(session, used);
  const promo = session.promo ?? {};
  const hasPromo = Boolean(
    promo.poster_url ||
    promo.event_date ||
    promo.event_time ||
    promo.location_name ||
    promo.includes?.length ||
    promo.promo_text ||
    promo.promo_price,
  );

  return (
    <main className="relative">
      <div
        className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-sun-100/70 to-transparent"
        aria-hidden
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link
          href="/#sesi"
          className="text-sm font-semibold text-brand-700 hover:underline"
        >
          ← Semua sesi
        </Link>

        <div
          className={
            hasPromo
              ? "mt-6 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
              : "mx-auto mt-6 max-w-2xl"
          }
        >
          {/* Info promosi */}
          {hasPromo && (
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {promo.poster_url && (
                <div className="relative">
                  <div
                    className="absolute inset-0 translate-x-3 translate-y-3 rounded-leaf bg-brand-500"
                    aria-hidden
                  />
                  <div className="relative overflow-hidden rounded-leaf border-4 border-white shadow-lg">
                    <Image
                      src={promo.poster_url}
                      alt={`Poster ${session.title}`}
                      width={800}
                      height={1000}
                      priority
                      className="h-auto w-full"
                    />
                  </div>
                  {priceLabel(promo) && (
                    <PriceBurst
                      prefix={promo.price_prefix}
                      price={priceLabel(promo)}
                      unit={promo.price_unit}
                      className="absolute -right-4 -top-6 w-28 text-[15px] sm:w-32 sm:text-base"
                    />
                  )}
                </div>
              )}
              <EventFacts promo={promo} />
              <PromoDeal promo={promo} />
              <IncludesRibbon promo={promo} />
            </aside>
          )}

          {/* Form */}
          <section>
            <div className="relative">
              <ShootingStar className="absolute -right-2 -top-6 h-16 w-16" />
              <div className="flex flex-wrap gap-2">
                {av.open ? (
                  <Badge color="green">● Pendaftaran dibuka</Badge>
                ) : (
                  <Badge color="red">{REASONS[av.reason]}</Badge>
                )}
                {promo.partner && (
                  <Badge color="blue">bersama {promo.partner}</Badge>
                )}
              </div>
              <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
                {session.title}
              </h1>
              {promo.subtitle && (
                <p className="mt-1 text-lg font-semibold text-leaf-500">
                  {promo.subtitle}
                </p>
              )}
              {!promo.poster_url && priceLabel(promo) && (
                <p className="mt-3 text-2xl font-extrabold text-brand-700">
                  {priceLabel(promo)}{" "}
                  <span className="text-base font-semibold text-muted-foreground">
                    {promo.price_unit}
                  </span>
                </p>
              )}
              {session.description && (
                <p className="mt-4 whitespace-pre-line text-muted-foreground">
                  {session.description}
                </p>
              )}
            </div>

            <div className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-line">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {used}/{session.quota} kursi terisi
                </span>
                <span
                  className={
                    av.remaining <= 5
                      ? "font-bold text-berry-500"
                      : "font-bold text-brand-700"
                  }
                >
                  Sisa {av.remaining} kursi
                </span>
              </div>
              <QuotaBar used={used} quota={session.quota} />
              {(session.opens_at || session.closes_at) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {session.opens_at && (
                    <>Dibuka {fmtDate(session.opens_at)}. </>
                  )}
                  {session.closes_at && (
                    <>Pendaftaran ditutup {fmtDate(session.closes_at)}.</>
                  )}
                </p>
              )}
            </div>

            <div className="relative mt-6 overflow-hidden rounded-leaf border border-line bg-white p-6 sm:p-8">
              <Sparkle className="absolute right-5 top-5 h-4 w-4 text-sun-400" />
              <h2 className="mb-6 text-xl font-bold text-ink">
                Formulir pendaftaran
              </h2>
              {av.open ? (
                <DynamicForm
                  fields={session.fields}
                  action={submitForm.bind(null, slug)}
                  upload={createProofUpload.bind(null, slug)}
                  slotUsage={usage}
                  pricing={promo.fee ? { fee: promo.fee, group_prices: promo.group_prices, price_unit: promo.price_unit } : null}
                  submitLabel="Kirim pendaftaran"
                />
              ) : av.reason === "not_open" && session.opens_at ? (
                <div className="space-y-3">
                  <OpenCountdown opensAt={session.opens_at} />
                  <p className="text-center text-xs text-muted-foreground">
                    Formulir akan terbuka otomatis pada{" "}
                    {fmtDate(session.opens_at)}.
                  </p>
                </div>
              ) : (
                <Alert>{REASONS[av.reason]}</Alert>
              )}
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Sudah mengisi?{" "}
              <Link
                href="/cek"
                className="font-semibold text-brand-700 hover:underline"
              >
                Cek ulang pendaftaranmu
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
