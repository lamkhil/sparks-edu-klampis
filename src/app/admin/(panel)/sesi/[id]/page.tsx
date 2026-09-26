import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionEditor } from "@/components/session-editor";
import { getSessionById } from "@/lib/data";
import { appUrl } from "@/lib/template";
import { deleteSession, duplicateSession, saveSession } from "../actions";
import { ConfirmButton } from "@/app/cek/[code]/confirm-button";

export const metadata = { title: "Edit sesi" };

export default async function EditSessionPage({ params }: PageProps<"/admin/sesi/[id]">) {
  const { id } = await params;
  const session = await getSessionById(id);
  if (!session) notFound();

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center gap-4 text-sm">
        <Link href="/admin" className="text-gray-600 hover:underline">
          ← Semua sesi
        </Link>
        <Link href={`/admin/sesi/${id}/submisi`} className="font-medium text-indigo-600 hover:underline">
          Lihat isian →
        </Link>
      </div>
      <SessionEditor session={session} save={saveSession.bind(null, id)} appUrl={appUrl()} />
      <div className="mt-12 flex flex-wrap gap-3 border-t border-gray-200 pt-6">
        <form action={duplicateSession.bind(null, id)}>
          <ConfirmButton variant="secondary" message="Buat salinan sesi ini (tanpa isian)?">
            Duplikat sesi
          </ConfirmButton>
        </form>
        <form action={deleteSession.bind(null, id)}>
          <ConfirmButton message="Hapus sesi ini beserta SEMUA isiannya? Tindakan ini tidak bisa dibatalkan.">Hapus sesi</ConfirmButton>
        </form>
      </div>
    </>
  );
}
