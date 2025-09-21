import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/convex-client-provider";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { PWAPrompt } from "@/components/pwa-prompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "SubWise - Manage Your Subscriptions",
  description: "Track, analyze, and manage all your subscriptions in one place",
  keywords: ["subscription tracker", "expense tracking", "subscription management", "budget", "finance"],
  authors: [{ name: "SubWise Team" }],
  creator: "SubWise",
  publisher: "SubWise",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SubWise",
    startupImage: [
      {
        url: "/icons/apple-touch-icon-180x180.png",
        media: "screen",
      },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "SubWise",
    title: "SubWise - Manage Your Subscriptions",
    description: "Track, analyze, and manage all your subscriptions in one place",
    url: "https://subscription-tracker-nu.vercel.app",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SubWise - Subscription Management Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SubWise - Manage Your Subscriptions",
    description: "Track, analyze, and manage all your subscriptions in one place",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icons/safari-pinned-tab.svg", color: "#3b82f6" },
    ],
  },
};

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.variable} ${jetbrainsMono.variable} ${sourceSerif.variable} font-sans antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConvexClientProvider>
              {children}
              <Toaster />
              <PWAPrompt />
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
