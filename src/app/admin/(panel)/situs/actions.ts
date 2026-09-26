"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { siteSchema, type SiteSettings } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

export async function saveSite(input: SiteSettings) {
  await requireAdmin();
  const parsed = siteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const { error } = await createAdminClient().from("settings").update({ site: parsed.data }).eq("id", 1);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true as const };
}

/** URL upload bertanda tangan untuk logo / foto hero / gambar share (bucket publik "posters"). */
export async function createSiteAssetUpload(ext: string) {
  await requireAdmin();
  const safeExt = ["jpg", "jpeg", "png", "webp", "svg"].includes(ext) ? ext : "png";
  const path = `site/${Date.now()}.${safeExt}`;
  const storage = createAdminClient().storage.from("posters");
  const { data, error } = await storage.createSignedUploadUrl(path);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, path, token: data.token, publicUrl: storage.getPublicUrl(path).data.publicUrl };
}
