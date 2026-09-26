import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Alert, Card } from "@/components/ui";
import { getSessionBySlug, getSubmissionByCode } from "@/lib/data";
import { renderTemplate, templateVars } from "@/lib/template";
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
  const message = renderTemplate(session.success_message, templateVars(session, submission));

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <Card className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">✓</div>
        <h1 className="text-xl font-bold">{session.title}</h1>
        <p className="mt-4 whitespace-pre-line text-left text-gray-700">{message}</p>
        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Kode submission</p>
          <CopyCode code={submission.code} />
        </div>
        {session.email_enabled && (
          <div className="mt-4 text-left">
            {submission.email_status === "sent" ? (
              <Alert tone="success">Email konfirmasi sudah dikirim ke {submission.email}.</Alert>
            ) : submission.email_status === "failed" ? (
              <Alert>Email konfirmasi gagal dikirim. Simpan kode di atas baik-baik.</Alert>
            ) : null}
          </div>
        )}
        <Link href={`/cek?kode=${submission.code}`} className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:underline">
          Cek ulang isian →
        </Link>
      </Card>
    </main>
  );
}
