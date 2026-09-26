import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/mailer";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Pengaturan SMTP" };

export default async function SettingsPage() {
  const user = await requireAdmin();
  const { smtp_pass, ...s } = await getSettings();
  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">Pengaturan SMTP</h1>
      <p className="mb-6 text-sm text-gray-600">
        Dipakai untuk mengirim email konfirmasi di semua sesi. Contoh Gmail: host <code>smtp.gmail.com</code>, port <code>465</code> (SSL aktif), user = alamat Gmail,
        password = App Password (bukan password akun).
      </p>
      <SettingsForm settings={s} hasPassword={!!smtp_pass} adminEmail={user.email ?? ""} />
    </div>
  );
}
