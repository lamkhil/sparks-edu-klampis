import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "@/lib/env";

// Menyegarkan cookie sesi login admin Supabase.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getUser();
  } catch (e) {
    console.error("proxy: gagal menyegarkan sesi Supabase", e);
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
