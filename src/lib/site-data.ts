import "server-only";
import { cache } from "react";
import { createAdminClient } from "./supabase/admin";
import { DEFAULT_SITE, mergeSite, type SiteSettings } from "./site";

/** Pengaturan situs dari database (sekali per request). */
export const getSite = cache(async (): Promise<SiteSettings> => {
  try {
    const { data } = await createAdminClient().from("settings").select("site").eq("id", 1).maybeSingle();
    return mergeSite(data?.site);
  } catch {
    return DEFAULT_SITE;
  }
});
