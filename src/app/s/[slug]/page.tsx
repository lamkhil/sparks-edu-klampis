import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DynamicForm } from "@/components/dynamic-form";
import { Alert, Card, QuotaBar } from "@/components/ui";
import { countActive, getSessionBySlug } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { sessionAvailability } from "@/lib/types";
import { submitForm } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/s/[slug]">): Promise<Metadata> {
  const s = await getSessionBySlug((await params).slug);
  return { title: s?.title ?? "Form" };
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
  const used = await countActive(session.id);
  const av = sessionAvailability(session, used);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Card className="mb-6 border-t-4 border-t-indigo-600">
        <h1 className="text-2xl font-bold tracking-tight">{session.title}</h1>
        {session.description && <p className="mt-2 whitespace-pre-line text-gray-700">{session.description}</p>}
        <div className="mt-5">
          <div className="mb-1 flex justify-between text-xs text-gray-600">
            <span>
              {used} / {session.quota} terisi
            </span>
            <span className="font-medium">Sisa kuota: {av.remaining}</span>
          </div>
          <QuotaBar used={used} quota={session.quota} />
        </div>
        {(session.opens_at || session.closes_at) && (
          <p className="mt-3 text-xs text-gray-500">
            {session.opens_at && <>Dibuka {fmtDate(session.opens_at)}. </>}
            {session.closes_at && <>Ditutup {fmtDate(session.closes_at)}.</>}
          </p>
        )}
      </Card>

      <Card>
        {av.open ? (
          <DynamicForm fields={session.fields} action={submitForm.bind(null, slug)} submitLabel="Kirim pendaftaran" />
        ) : (
          <Alert>{REASONS[av.reason]}</Alert>
        )}
      </Card>

      <p className="mt-6 text-center text-sm text-gray-500">
        Sudah mengisi?{" "}
        <Link href="/cek" className="font-medium text-indigo-600 hover:underline">
          Cek ulang isianmu
        </Link>
      </p>
    </main>
  );
}
