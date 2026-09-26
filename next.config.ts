import type { NextConfig } from "next";

const pick = (...v: (string | undefined)[]) => v.map((x) => x?.trim()).find(Boolean) ?? "";
// Nilai publik untuk browser: pakai NEXT_PUBLIC_*, atau cadangan dari integrasi Supabase-Vercel.
const supabaseUrl = pick(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL);
const supabasePublicKey = pick(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  process.env.SUPABASE_PUBLISHABLE_KEY,
  process.env.SUPABASE_ANON_KEY,
);
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "*.supabase.co";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabasePublicKey,
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }],
  },
};

export default nextConfig;
