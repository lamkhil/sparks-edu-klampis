"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";
import { createAdminClient } from "@/lib/supabase/admin";
import { appUrl, escapeHtml } from "@/lib/template";

export type AdminRow = { id: string; email: string; createdAt: string; lastSignIn: string | null };
type Result = { ok: true; password?: string; emailed?: boolean; emailError?: string } | { ok: false; error: string };

/** Password sementara yang mudah dibaca (tanpa karakter mirip seperti 0/O, 1/l). */
function tempPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 14 }, () => chars[randomInt(chars.length)]).join("");
}

async function findUserByEmail(email: string) {
  const db = createAdminClient();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const u = data.users.find((x) => x.email?.toLowerCase() === email);
    if (u) return u;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function mailCredentials(email: string, password: string, isNew: boolean) {
  const url = `${appUrl()}/admin/login`;
  const text = `Halo,\n\n${isNew ? "Kamu ditambahkan sebagai admin" : "Password admin kamu direset"} di panel Sparks Session (Sparks English Klampis).\n\nLogin: ${url}\nEmail: ${email}\nPassword sementara: ${password}\n\nSegera ganti password setelah login melalui menu akun (Ganti password).\n\nSalam,\nSparks English Klampis`;
  const html = `<div style="font-family:system-ui,Arial,sans-serif;font-size:15px;line-height:1.6">${escapeHtml(text).replace(/\n/g, "<br>")}</div>`;
  await sendMail(email, isNew ? "Akses admin Sparks Session" : "Reset password admin Sparks Session", text, html);
}

export async function listAdmins(): Promise<AdminRow[]> {
  await requireAdmin();
  const db = createAdminClient();
  const { data: rows } = await db.from("admins").select("user_id, created_at").order("created_at");
  const out: AdminRow[] = [];
  for (const r of rows ?? []) {
    const { data } = await db.auth.admin.getUserById(r.user_id);
    out.push({ id: r.user_id, email: data.user?.email ?? "(akun terhapus)", createdAt: r.created_at, lastSignIn: data.user?.last_sign_in_at ?? null });
  }
  return out;
}

export async function addAdmin(input: { email: string; sendEmail: boolean }): Promise<Result> {
  await requireAdmin();
  const parsed = z.email("Format email tidak valid").safeParse(input.email.trim().toLowerCase());
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const email = parsed.data;
  const db = createAdminClient();

  let user = await findUserByEmail(email);
  let password: string | undefined;
  if (!user) {
    password = tempPassword();
    const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) return { ok: false, error: error.message };
    user = data.user;
  }
  const { data: existing } = await db.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (existing) return { ok: false, error: `${email} sudah menjadi admin.` };
  const { error } = await db.from("admins").insert({ user_id: user.id });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/pengguna");

  if (password && input.sendEmail) {
    try {
      await mailCredentials(email, password, true);
      return { ok: true, password, emailed: true };
    } catch (e) {
      return { ok: true, password, emailed: false, emailError: e instanceof Error ? e.message : String(e) };
    }
  }
  return { ok: true, password };
}

export async function resetAdminPassword(userId: string, sendEmail: boolean): Promise<Result> {
  await requireAdmin();
  const db = createAdminClient();
  const { data: row } = await db.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!row) return { ok: false, error: "Bukan admin." };
  const password = tempPassword();
  const { data, error } = await db.auth.admin.updateUserById(userId, { password });
  if (error) return { ok: false, error: error.message };
  if (sendEmail && data.user.email) {
    try {
      await mailCredentials(data.user.email, password, false);
      return { ok: true, password, emailed: true };
    } catch (e) {
      return { ok: true, password, emailed: false, emailError: e instanceof Error ? e.message : String(e) };
    }
  }
  return { ok: true, password };
}

export async function removeAdmin(userId: string): Promise<Result> {
  const me = await requireAdmin();
  if (me.id === userId) return { ok: false, error: "Tidak bisa menghapus akunmu sendiri." };
  const db = createAdminClient();
  const { count } = await db.from("admins").select("user_id", { count: "exact", head: true });
  if ((count ?? 0) <= 1) return { ok: false, error: "Minimal harus ada satu admin." };
  await db.from("admins").delete().eq("user_id", userId);
  // Akun login ikut dihapus agar tidak ada akun menggantung.
  await db.auth.admin.deleteUser(userId);
  revalidatePath("/admin/pengguna");
  return { ok: true };
}
