import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReplyEase AI",
  description: "Smart AI replies for Middle Eastern e-commerce sellers",
};

function getDir(locale: string): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }

  const dir = getDir(lang);

  return (
    <html lang={lang} dir={dir} className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <head>
        {lang === "ar" && (
          <link
            href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap"
            rel="stylesheet"
          />
        )}
      </head>
      <body className="min-h-screen bg-background text-foreground" style={lang === "ar" ? { fontFamily: "'Tajawal', sans-serif" } : undefined}>
        <NextIntlClientProvider>
          <TRPCProvider>
            <AuthProvider>
              <TooltipProvider>
                <AppShell>{children}</AppShell>
                <Toaster position="bottom-right" dir={dir} />
              </TooltipProvider>
            </AuthProvider>
          </TRPCProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
