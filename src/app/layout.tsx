import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/convex-client-provider";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "SubTracker - Manage Your Subscriptions",
  description: "Track, analyze, and manage all your subscriptions in one place",
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
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
          className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
        >
          <ConvexClientProvider>
            {children}
            <Toaster />
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
