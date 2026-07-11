import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { ActiveTripBanner } from "@/components/layout/ActiveTripBanner";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageTransition } from "@/components/layout/PageTransition";
import { ThemeAwareToaster } from "@/components/layout/ThemeAwareToaster";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { SuperAdminBanner } from "@/features/superadmin/components/SuperAdminBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "LifeLog — Personal Routine & Expense Tracker",
  description: "Progressive web app for logging timestamped activities, trips, mobility patterns, and expenses with offline support.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LifeLog",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen pb-20 selection:bg-indigo-500 selection:text-white`}>
        <AuthProvider>
          <ThemeProvider>
            <SuperAdminBanner />
            <Header />
            <ActiveTripBanner />
            <main className="max-w-4xl mx-auto px-4 py-6 overflow-x-hidden">
              <PageTransition>{children}</PageTransition>
            </main>
            <BottomNav />
            <ThemeAwareToaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
