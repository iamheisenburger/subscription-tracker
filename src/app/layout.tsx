import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/convex-client-provider";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { UserSync } from "@/components/user-sync";
import { TestModeBanner } from "@/components/test-mode-banner";
import { Analytics } from "@/lib/analytics";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://usesubwise.app'),
  title: {
    default: "SubWise - Smart Subscription Management & Tracking",
    template: "%s | SubWise"
  },
  description: "Track, analyze, and manage all your subscriptions in one place. Get smart alerts, spending insights, and never miss a renewal with SubWise.",
  keywords: ['subscription tracker', 'subscription management', 'recurring payments', 'spending tracker', 'budget management', 'subscription analytics'],
  authors: [{ name: 'SubWise' }],
  creator: 'SubWise',
  publisher: 'SubWise',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://usesubwise.app',
    title: 'SubWise - Smart Subscription Management',
    description: 'Track, analyze, and manage all your subscriptions in one place. Never miss a renewal again.',
    siteName: 'SubWise',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'SubWise - Subscription Management'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SubWise - Smart Subscription Management',
    description: 'Track and manage all your subscriptions in one place',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code here
    // google: 'your-google-verification-code',
  },
};

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      appearance={{
        variables: {
          colorPrimary: "hsl(var(--primary))",
          fontFamily: "var(--font-sans)",
        },
        elements: {
          formButtonPrimary: 
            "bg-primary text-primary-foreground hover:bg-primary/90 text-sm normal-case font-medium",
          card: "bg-card shadow-lg border border-border",
        },
      }}
    >
      <html lang="en">
        <body className={`${inter.variable} font-sans antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConvexClientProvider>
              <Analytics />
              <TestModeBanner />
              <UserSync />
              {children}
              <Toaster />
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
