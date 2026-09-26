import { amountBreakdown, computeAmount, formatRupiah } from "@/lib/promo";
import { whatsappTargets } from "@/lib/template";
import type { Session, Submission } from "@/lib/types";
import { CopyText } from "./copy-text";
import { WhatsappButton } from "./whatsapp-button";

/** Kartu pembayaran: total, rekening (bisa disalin) & tombol konfirmasi WhatsApp. */
export function PaymentCard({ session, submission }: { session: Session; submission: Submission }) {
  const promo = session.promo ?? {};
  const amount = submission.amount ?? computeAmount(promo, submission.guest_count);
  const hasBank = Boolean(promo.bank_account);
  const targets = whatsappTargets(session, submission);
  if (amount === null && !hasBank && targets.length === 0) return null;

  return (
    <div className="rounded-leaf border border-sun-300 bg-sun-50 p-5 text-left">
      <p className="text-xs font-bold uppercase tracking-wider text-sun-700">Pembayaran</p>
      {amount !== null && (
        <div className="mt-2">
          <p className="text-3xl font-extrabold tracking-tight text-ink">{formatRupiah(amount)}</p>
          <p className="text-sm text-muted-foreground">{amountBreakdown(promo, submission.guest_count)}</p>
        </div>
      )}
      {hasBank && (
        <dl className="mt-4 space-y-2 rounded-2xl bg-white p-4 text-sm ring-1 ring-sun-200">
          {promo.bank_name && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Bank</dt>
              <dd className="font-semibold text-ink">{promo.bank_name}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">No. rekening</dt>
            <dd>
              <CopyText text={promo.bank_account!} />
            </dd>
          </div>
          {promo.bank_holder && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Atas nama</dt>
              <dd className="font-semibold text-ink">{promo.bank_holder}</dd>
            </div>
          )}
        </dl>
      )}
      {targets.length > 0 && (
        <div className="mt-4 space-y-2">
          {targets.map((t) => (
            <WhatsappButton key={t.href} href={t.href}>
              {t.label}
            </WhatsappButton>
          ))}
          <p className="text-xs text-muted-foreground">Pesan berisi kode & data pendaftaran terisi otomatis. Lampirkan foto bukti transfer.</p>
        </div>
      )}
    </div>
  );
}
