import type { Metadata } from "next";

import "./globals.css";

import { Toaster } from "@/components/ui/toast";
import { siteUrl } from "@/lib/site";

// The root layout is a SERVER component: metadata + the global toaster.
// VeloxPOS is dark-canvas by design (no mode switcher — the reference has
// none), so there is no pre-paint theme boot script.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "VeloxPOS — Punto de venta",
  description:
    "Terminal de venta, inventario, cajas y reportes para tu tienda.",
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
