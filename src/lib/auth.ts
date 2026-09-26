import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

/** Pastikan yang mengakses adalah admin; jika tidak, arahkan ke halaman login. */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!data) redirect("/admin/login?error=not_admin");
  return user;
}
