"use client";

import { useActionState, useState } from "react";
import { Alert, Button, Card, Input, Label, Toggle } from "@/components/ui";
import type { Settings } from "@/lib/types";
import { saveSettings, type SettingsState } from "./actions";

export function SettingsForm({ settings, hasPassword, adminEmail }: { settings: Omit<Settings, "smtp_pass">; hasPassword: boolean; adminEmail: string }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, null);
  const [secure, setSecure] = useState(!!settings.smtp_secure);

  return (
    <form action={action} className="space-y-6">
      {state?.ok && <Alert tone="success">{state.ok}</Alert>}
      {state?.error && <Alert>{state.error}</Alert>}
      <Card className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label required>Host SMTP</Label>
          <Input name="smtp_host" defaultValue={settings.smtp_host ?? ""} placeholder="smtp.gmail.com" />
        </div>
        <div>
          <Label required>Port</Label>
          <Input name="smtp_port" type="number" defaultValue={settings.smtp_port ?? 587} />
        </div>
        <div className="sm:col-span-2">
          <Toggle name="smtp_secure" checked={secure} onChange={setSecure} label="Gunakan SSL/TLS langsung" hint="Aktifkan untuk port 465. Matikan untuk port 587 (STARTTLS)." />
        </div>
        <div>
          <Label>Username</Label>
          <Input name="smtp_user" defaultValue={settings.smtp_user ?? ""} autoComplete="off" />
        </div>
        <div>
          <Label>Password</Label>
          <Input name="smtp_pass" type="password" placeholder={hasPassword ? "•••••••• (kosongkan jika tidak diubah)" : ""} autoComplete="new-password" />
        </div>
        <div>
          <Label>Nama pengirim</Label>
          <Input name="mail_from_name" defaultValue={settings.mail_from_name ?? ""} placeholder="Panitia Acara" />
        </div>
        <div>
          <Label required>Email pengirim</Label>
          <Input name="mail_from_email" type="email" defaultValue={settings.mail_from_email ?? ""} />
        </div>
      </Card>
      <Card className="flex flex-wrap items-end gap-3">
        <div className="min-w-60 flex-1">
          <Label>Kirim email tes ke</Label>
          <Input name="test_to" type="email" defaultValue={adminEmail} />
        </div>
        <Button type="submit" name="intent" value="test" variant="secondary" disabled={pending}>
          Simpan & kirim tes
        </Button>
        <Button type="submit" name="intent" value="save" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
      </Card>
    </form>
  );
}
