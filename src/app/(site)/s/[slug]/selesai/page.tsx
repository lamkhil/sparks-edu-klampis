import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ShootingStar, Sparkle } from "@/components/brand";
import { EventFacts } from "@/components/session-promo";
import { Alert, Card, buttonClass } from "@/components/kit";
import { getSessionBySlug, getSubmissionByCode } from "@/lib/data";
import { renderTemplate, splitCopyMarks } from "@/lib/template";
import { fullTemplateVars } from "@/lib/template-server";
import { RichMessage } from "@/components/copy-text";
import { PaymentCard } from "@/components/payment-card";
import { CopyCode } from "./copy-code";

export const dynamic = "force-dynamic";

export default async function DonePage({ params }: PageProps<"/s/[slug]/selesai">) {
  const { slug } = await params;
  const session = await getSessionBySlug(slug);
  if (!session) notFound();
  const code = (await cookies()).get(`done_${session.id}`)?.value;
  const found = code ? await getSubmissionByCode(code) : null;
  if (!found || found.session.id !== session.id) redirect(`/s/${slug}`);
  const { submission } = found;
  const message = renderTemplate(session.success_message, fullTemplateVars(session, submission));

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <Card className="relative overflow-hidden text-center">
        <ShootingStar className="absolute -right-3 -top-3 h-20 w-20" />
        <Sparkle className="absolute left-6 top-10 h-4 w-4 text-leaf-500" />
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-600 text-3xl font-bold text-white ring-8 ring-brand-50">✓</div>
        <p className="text-sm font-bold uppercase tracking-wider text-leaf-500">Pendaftaran berhasil!</p>
        <h1 className="mt-1 text-2xl font-extrabold text-ink">{session.title}</h1>
        <RichMessage parts={splitCopyMarks(message)} className="mt-4 whitespace-pre-line text-left text-muted-foreground" />
        <div className="mt-6 rounded-leaf bg-sun-100 p-5 ring-1 ring-sun-300">
          <p className="text-xs font-bold uppercase tracking-wider text-sun-700">Kode pendaftaran</p>
          <CopyCode code={submission.code} />
        </div>
        {submission.payment_status !== "none" && (
          <div className="mt-5">
            <PaymentCard session={session} submission={submission} />
          </div>
        )}
        <div className="mt-4 text-left">
          <EventFacts promo={session.promo ?? {}} />
        </div>
        <div className="mt-4 text-left">
          {submission.email && session.email_enabled && submission.email_status === "sent" ? (
            <Alert tone="success">Email konfirmasi sudah dikirim ke {submission.email}.</Alert>
          ) : (
            <Alert tone="info">
              <b>Simpan kode di atas</b> (screenshot halaman ini). Kode dan No. HP/email yang kamu isi dipakai untuk cek ulang pendaftaran.
            </Alert>
          )}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/cek?kode=${submission.code}`} className={buttonClass("primary")}>
            Cek ulang isian
          </Link>
          <Link href="/" className={buttonClass("secondary")}>
            Kembali ke beranda
          </Link>
        </div>
      </Card>
    </main>
  );
}
