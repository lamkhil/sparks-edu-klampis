import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { getSite } from "@/lib/site-data";

const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const name = [site.brand, site.branch].filter(Boolean).join(" ");
  return {
    title: { default: `${site.event_name} · ${name}`, template: `%s · ${name}` },
    description: site.tagline,
    openGraph: site.og_image_url ? { images: [site.og_image_url] } : undefined,
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${poppins.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
