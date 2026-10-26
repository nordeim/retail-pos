import type { Metadata } from "next";

import "./globals.css";

import { Toaster } from "@/components/ui/toast";
import { siteUrl } from "@/lib/site";

// The root layout is a SERVER component: metadata + the global toaster.
// VeloxPOS is dark-canvas by design (no mode switcher — the reference has
// none), so there is no pre-paint theme boot script.
//
// V6/M1: the head suite mirrors the reference's own <head> (live-dumped):
// title "VeloxPOS" (no suffix), its description verbatim, the full
// openGraph + twitter cards, the apple/PWA meta, and a WORKING manifest
// (theirs 302s). og:image is the 1200x630 logo render (public/og-image.png);
// the tab icon is the app-router icon.png convention (the VeloxPOS logo —
// the same asset the reference's favicon serves).
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "VeloxPOS",
  description:
    "A sophisticated, glass-inspired point of sale and inventory management system for modern retailers.",
  openGraph: {
    title: "VeloxPOS",
    description:
      "A sophisticated, glass-inspired point of sale and inventory management system for modern retailers.",
    url: siteUrl(),
    type: "website",
    siteName: "VeloxPOS",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "VeloxPOS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VeloxPOS",
    description:
      "A sophisticated, glass-inspired point of sale and inventory management system for modern retailers.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "VeloxPOS",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="vx-canvas min-h-dvh antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
