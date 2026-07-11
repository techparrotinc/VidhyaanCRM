import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Suspense } from "react";
import PageTransitionProvider from "@/components/PageTransitionProvider";
import LoadingScreen from "@/components/LoadingScreen";
import { AppAlertHost } from "@/components/ui/app-alert";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vidhyaan.com"),
  title: {
    default: "Vidhyaan — School CRM & Marketplace",
    template: "%s | Vidhyaan",
  },
  description:
    "India's premier marketplace for school discoverability, trust, and operations. Helping schools, preschools, and learning academies capture admissions and automate fee invoicing securely.",
  openGraph: {
    siteName: "Vidhyaan",
    type: "website",
    locale: "en_IN",
  },
};

import { SessionProvider } from "next-auth/react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Vidhyaan",
              "url": "https://vidhyaan.com",
              "logo": "https://vidhyaan.com/brand/vidhyaan-icon-512.png",
              "description": "India's premier marketplace for school discoverability, trust, and operations. Helping thousands of nursery schools, preschools, and learning academies capture admissions and automate fee invoicing securely."
            })
          }}
        />
        <SessionProvider>
          <PageTransitionProvider>
            <Suspense fallback={<LoadingScreen />}>
              {children}
            </Suspense>
          </PageTransitionProvider>
        </SessionProvider>
        <AppAlertHost />
      </body>
    </html>
  );
}
