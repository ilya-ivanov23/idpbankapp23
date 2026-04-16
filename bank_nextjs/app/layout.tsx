export const dynamic = 'force-dynamic'

import type { Metadata } from "next";
import { Inter, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";
import { BalanceProvider } from "@/components/BalanceProvider";
import { ThemeProvider } from "@/components/theme-provider";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-ibm-plex-serif'
})

import * as Sentry from '@sentry/nextjs';

export function generateMetadata(): Metadata {
  return {
    title: "IDPBankApp",
    description: "IDP multiplatform for user which chooses future",
    icons: {
      icon: '/icons/logo.svg'
    },
    other: {
      ...Sentry.getTraceData()
    }
  };
}

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${ibmPlexSerif.variable}`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
        <BalanceProvider>
          {children}
        </BalanceProvider>
        </ThemeProvider>
        <Script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js" strategy="beforeInteractive" />
      </body>
      </html>
  );
}
