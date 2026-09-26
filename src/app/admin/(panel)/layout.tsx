import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-4 py-3">
          <Link href="/admin" className="font-bold">
            Form Berkuota
          </Link>
          <nav className="flex gap-4 text-sm text-gray-600">
            <Link href="/admin" className="hover:text-gray-900">
              Sesi
            </Link>
            <Link href="/admin/pengaturan" className="hover:text-gray-900">
              Pengaturan SMTP
            </Link>
            <Link href="/" target="_blank" className="hover:text-gray-900">
              Lihat situs ↗
            </Link>
          </nav>
          <form action={logout} className="ml-auto flex items-center gap-3 text-sm text-gray-500">
            <span className="hidden sm:inline">{user.email}</span>
            <button className="text-gray-700 hover:underline">Keluar</button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
