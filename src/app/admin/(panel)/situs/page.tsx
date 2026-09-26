import { AdminPage, PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth";
import { getSite } from "@/lib/site-data";
import { SiteForm } from "./site-form";

export const metadata = { title: "Tampilan Situs" };

export default async function SiteSettingsPage() {
  await requireAdmin();
  const site = await getSite();
  return (
    <AdminPage crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Tampilan Situs" }]}>
      <PageHeader title="Tampilan Situs" description="Semua teks, logo & gambar di halaman publik (landing page, header, footer)." />
      <SiteForm initial={site} />
    </AdminPage>
  );
}
