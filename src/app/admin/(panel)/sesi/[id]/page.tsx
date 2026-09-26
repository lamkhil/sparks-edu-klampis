import { Copy, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/page-header";
import { ConfirmButton } from "@/components/confirm-button";
import { SessionEditor } from "@/components/session-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionById } from "@/lib/data";
import { appUrl } from "@/lib/template";
import { deleteSession, duplicateSession, saveSession } from "../actions";

export const metadata = { title: "Edit sesi" };

export default async function EditSessionPage({ params }: PageProps<"/admin/sesi/[id]">) {
  const { id } = await params;
  const session = await getSessionById(id);
  if (!session) notFound();

  return (
    <AdminPage crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Sesi & Form", href: "/admin/sesi" }, { label: session.title }]}>
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/sesi/${id}/submisi`}>
            <Users /> Lihat pendaftar
          </Link>
        </Button>
      </div>
      <SessionEditor session={session} save={saveSession.bind(null, id)} appUrl={appUrl()} />

      <Card className="mt-12 border-destructive/20">
        <CardHeader>
          <CardTitle>Tindakan lain</CardTitle>
          <CardDescription>Duplikat membuat salinan sesi tanpa pendaftar. Hapus akan menghilangkan sesi beserta seluruh pendaftarnya.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <form action={duplicateSession.bind(null, id)}>
            <ConfirmButton variant="secondary" message="Buat salinan sesi ini (tanpa pendaftar)?">
              <Copy className="size-4" /> Duplikat sesi
            </ConfirmButton>
          </form>
          <form action={deleteSession.bind(null, id)}>
            <ConfirmButton message="Hapus sesi ini beserta SEMUA pendaftarnya? Tindakan ini tidak bisa dibatalkan.">
              <Trash2 className="size-4" /> Hapus sesi
            </ConfirmButton>
          </form>
        </CardContent>
      </Card>
    </AdminPage>
  );
}
