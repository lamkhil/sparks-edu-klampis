"use server";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type PwState = { ok?: string; error?: string } | null;

export async function changePassword(_: PwState, fd: FormData): Promise<PwState> {
  await requireAdmin();
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (password.length < 10) return { error: "Password minimal 10 karakter." };
  if (password !== confirm) return { error: "Konfirmasi password tidak sama." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { ok: "Password berhasil diganti." };
}
