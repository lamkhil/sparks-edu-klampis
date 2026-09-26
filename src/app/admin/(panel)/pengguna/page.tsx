import { AdminPage, PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth";
import { listAdmins } from "./actions";
import { AdminsManager } from "./admins-manager";

export const metadata = { title: "Admin" };

export default async function AdminsPage() {
  const me = await requireAdmin();
  const admins = await listAdmins();
  return (
    <AdminPage crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Admin" }]}>
      <PageHeader title="Admin" description="Orang yang bisa masuk ke panel ini: mengelola sesi, melihat pendaftar, dan mengubah pengaturan." />
      <AdminsManager admins={admins} meId={me.id} />
    </AdminPage>
  );
}
