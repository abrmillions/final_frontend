import type React from "react";
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/lib/auth/auth-context";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from "next/font/google";
import "./globals.css";
import MaintenanceBanner from "@/components/maintenance-banner";
import { DJANGO_API_URL } from "@/lib/config/django-api";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  let title = "Construction License Management System"
  try {
    const r = await fetch(`${DJANGO_API_URL}/api/system/support/`, { cache: "no-store" })
    if (r.ok) {
      const s = await r.json()
      const n = String(s?.system_name || "").trim()
      if (n) title = n
    }
  } catch {}
  return {
    title,
    description: "Government e-Platform for construction sector licensing, permits, and verification",
    generator: "clms.app",
    icons: {
      icon: [
        { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
        { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: "/apple-icon.png",
    },
  }
}

export const viewport: Viewport = {
  themeColor: "#2d3e8f",
  width: "device-width",
  initialScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialMaintenance = false
  try {
    const r = await fetch(`${DJANGO_API_URL}/api/system/maintenance/`, { cache: "no-store" })
    if (r.ok) {
      const s = await r.json()
      initialMaintenance = !!s?.maintenance_mode
    } else if (r.status === 503) {
      initialMaintenance = true
    }
  } catch {}
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <AuthProvider initialMaintenance={initialMaintenance}>
          <MaintenanceBanner forceShow={initialMaintenance} />
          {children}
          <Toaster />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
