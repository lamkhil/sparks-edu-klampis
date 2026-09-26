import Link from "next/link";
import { Card } from "@/components/ui";
import { LookupForm } from "./lookup-form";

export const metadata = { title: "Cek ulang isian" };

export default async function CekPage({ searchParams }: PageProps<"/cek">) {
  const { kode } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <Card>
        <h1 className="text-xl font-bold">Cek ulang isian</h1>
        <p className="mb-6 mt-1 text-sm text-gray-600">Masukkan kode submission dan email yang kamu gunakan saat mengisi form.</p>
        <LookupForm defaultKode={typeof kode === "string" ? kode : undefined} />
      </Card>
      <p className="mt-6 text-center text-sm">
        <Link href="/" className="text-indigo-600 hover:underline">
          ← Kembali ke daftar sesi
        </Link>
      </p>
    </main>
  );
}
