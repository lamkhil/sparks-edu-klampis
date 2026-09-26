import Link from "next/link";
import { ShootingStar } from "@/components/brand";
import { Card } from "@/components/kit";
import { LookupForm } from "./lookup-form";

export const metadata = { title: "Cek ulang isian" };

export default async function CekPage({ searchParams }: PageProps<"/cek">) {
  const { kode } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <Card className="relative overflow-hidden rounded-leaf">
        <ShootingStar className="absolute -right-2 -top-2 h-16 w-16" />
        <h1 className="text-2xl font-extrabold text-ink">Cek pendaftaran</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">Masukkan kode submission dan email yang kamu gunakan saat mengisi form.</p>
        <LookupForm defaultKode={typeof kode === "string" ? kode : undefined} />
      </Card>
      <p className="mt-6 text-center text-sm">
        <Link href="/" className="text-brand-600 hover:underline">
          ← Kembali ke daftar sesi
        </Link>
      </p>
    </main>
  );
}
