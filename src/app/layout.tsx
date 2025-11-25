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
    default: "SubWise - Smart Subscription Tracker & Budget Manager | Never Miss a Renewal",
    template: "%s | SubWise - Subscription Management"
  },
  description: "Track all your subscriptions in one place. Get smart renewal alerts, analyze spending patterns, and save money with SubWise. Free plan available - start tracking Netflix, Spotify, Disney+ and more today.",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/icons/icon-192x192.png',
  },
  keywords: [
    // Primary keywords
    'subscription tracker', 'subscription management', 'subscription manager app',
    // Action-based keywords
    'track subscriptions', 'manage subscriptions', 'cancel subscriptions', 'subscription reminder',
    // Problem-solving keywords
    'stop unwanted subscriptions', 'subscription budget', 'subscription spending', 'subscription cost tracker',
    // Platform-specific
    'netflix subscription tracker', 'spotify subscription manager', 'disney plus tracker',
    // Feature-based
    'recurring payment tracker', 'subscription analytics', 'spending insights', 'budget management',
    'subscription alerts', 'renewal reminders', 'subscription dashboard',
    // Comparative & alternatives
    'truebill alternative', 'rocket money alternative', 'hiatus alternative', 'bobby app alternative',
    // Long-tail keywords
    'how to track all my subscriptions', 'app to manage subscriptions', 'subscription tracking software',
    'free subscription tracker', 'subscription expense tracker', 'monthly subscription manager'
  ],
  authors: [{ name: 'SubWise', url: 'https://usesubwise.app' }],
  creator: 'SubWise',
  publisher: 'SubWise',
  applicationName: 'SubWise',
  category: 'Finance & Budget Management',
  classification: 'Subscription Tracking & Management Software',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://usesubwise.app',
    title: 'SubWise - Smart Subscription Tracker & Budget Manager',
  description: 'Track all your subscriptions, get renewal alerts, and save money. Free plan with 3 subscriptions. Plus unlocks unlimited tracking, spending analytics & smart alerts.',
    siteName: 'SubWise',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'SubWise - Track, Manage & Save on Your Subscriptions'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SubWise - Never Miss a Subscription Renewal Again',
    description: 'Smart subscription tracker with renewal alerts, spending analytics & budget management. Free plan available.',
    images: ['/og-image.png'],
    creator: '@usesubwise',
    site: '@usesubwise'
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
  alternates: {
    canonical: 'https://usesubwise.app',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'SubWise',
    'format-detection': 'telephone=no',
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
