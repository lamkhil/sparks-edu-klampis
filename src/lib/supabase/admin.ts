import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, supabaseServiceKey } from "@/lib/env";

/** Client service-role: melewati RLS. Hanya dipakai di server. */
export function createAdminClient() {
  return createClient(SUPABASE_URL, supabaseServiceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
