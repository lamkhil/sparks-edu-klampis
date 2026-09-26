import { AdminPage, PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth";
import { PasswordForm } from "./password-form";

export const metadata = { title: "Akun saya" };

export default async function AccountPage() {
  const user = await requireAdmin();
  return (
    <AdminPage crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Akun saya" }]}>
      <PageHeader title="Akun saya" description={user.email} />
      <PasswordForm />
    </AdminPage>
  );
}
