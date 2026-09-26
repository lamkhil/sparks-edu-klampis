import Link from "next/link";
import { redirect } from "next/navigation";
import { DynamicForm } from "@/components/dynamic-form";
import { Alert, Badge, Card, buttonClass } from "@/components/ui";
import { hasAccess } from "@/lib/access";
import { getSubmissionByCode } from "@/lib/data";
import { emailKey, formatAnswer } from "@/lib/form-schema";
import { fmtDate } from "@/lib/format";
import { canModify } from "@/lib/types";
import { cancelSubmission, updateAnswers } from "../actions";
import { ConfirmButton } from "./confirm-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Isian saya" };

export default async function SubmissionPage({ params, searchParams }: PageProps<"/cek/[code]">) {
  const { code } = await params;
  const { edit } = await searchParams;
  if (!(await hasAccess(code))) redirect(`/cek?kode=${code}`);
  const found = await getSubmissionByCode(code);
  if (!found) redirect("/cek");
  const { session, submission } = found;
  const active = submission.status === "active";
  const can = canModify(session);
  const editing = edit === "1" && active && can.edit;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">{session.title}</p>
            <h1 className="font-mono text-2xl font-bold tracking-widest">{submission.code}</h1>
            <p className="mt-1 text-sm text-gray-600">Dikirim {fmtDate(submission.created_at)}</p>
          </div>
          {active ? <Badge color="green">Terdaftar</Badge> : <Badge color="red">Dibatalkan</Badge>}
        </div>
      </Card>

      <Card>
        {editing ? (
          <DynamicForm
            fields={session.fields}
            action={updateAnswers.bind(null, submission.code)}
            initialValues={submission.answers}
            lockedKeys={[emailKey(session.fields)]}
            submitLabel="Simpan perubahan"
            footer={
              <Link href={`/cek/${submission.code}`} className="text-sm text-gray-600 hover:underline">
                Selesai
              </Link>
            }
          />
        ) : session.allow_view ? (
          <dl className="divide-y divide-gray-100">
            {session.fields.map((f) => (
              <div key={f.id} className="grid gap-1 py-3 sm:grid-cols-3">
                <dt className="text-sm text-gray-500">{f.label}</dt>
                <dd className="whitespace-pre-line text-sm sm:col-span-2">{formatAnswer(submission.answers[f.key]) || "-"}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <Alert tone="info">Detail isian tidak ditampilkan untuk sesi ini. Status pendaftaranmu tertera di atas.</Alert>
        )}

        {active && !editing && (can.edit || can.cancel) && (
          <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-100 pt-5">
            {can.edit && (
              <Link href={`/cek/${submission.code}?edit=1`} className={buttonClass("secondary")}>
                Ubah isian
              </Link>
            )}
            {can.cancel && (
              <form action={cancelSubmission.bind(null, submission.code)}>
                <ConfirmButton message="Yakin batalkan pendaftaran? Slot kuota akan dilepas untuk orang lain.">Batalkan pendaftaran</ConfirmButton>
              </form>
            )}
          </div>
        )}
        {active && session.edit_deadline && (can.edit || can.cancel) && (
          <p className="mt-3 text-xs text-gray-500">Perubahan/pembatalan bisa dilakukan sampai {fmtDate(session.edit_deadline)}.</p>
        )}
      </Card>
    </main>
  );
}
