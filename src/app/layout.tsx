import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { prisma } from "@/lib/prisma";
import { THEME_PRESETS, DEFAULT_THEME_COLOR, isThemeColor } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bulk Supply — Wholesale Ordering",
  description: "Bulk Supply wholesale ordering platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  const themeColor = settings && isThemeColor(settings.themeColor) ? settings.themeColor : DEFAULT_THEME_COLOR;
  const preset = THEME_PRESETS[themeColor];

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ "--brand-green": preset.primary, "--brand-green-dark": preset.primaryDark } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <Providers>
          {children}
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
