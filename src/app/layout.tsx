import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: { default: `${SITE.eventName} · ${SITE.brand} ${SITE.branch}`, template: `%s · ${SITE.brand} ${SITE.branch}` },
  description: SITE.tagline,
  openGraph: { images: ["/brand/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${poppins.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
