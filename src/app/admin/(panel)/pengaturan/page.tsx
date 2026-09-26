import { AdminPage, PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/mailer";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Pengaturan SMTP" };

export default async function SettingsPage() {
  const user = await requireAdmin();
  const { smtp_pass, ...s } = await getSettings();
  return (
    <AdminPage crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Pengaturan SMTP" }]}>
      <div className="max-w-3xl">
      <PageHeader title="Pengaturan SMTP" />
      <p className="-mt-4 mb-6 text-sm text-muted-foreground">
        Dipakai untuk mengirim email konfirmasi di semua sesi. Contoh Gmail: host <code>smtp.gmail.com</code>, port <code>465</code> (SSL aktif), user = alamat Gmail,
        password = App Password (bukan password akun).
      </p>
      <SettingsForm settings={s} hasPassword={!!smtp_pass} adminEmail={user.email ?? ""} />
      </div>
    </AdminPage>
  );
}
