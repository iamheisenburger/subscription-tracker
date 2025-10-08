import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { CTABanner } from "@/components/landing/cta-banner";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  // JSON-LD structured data for better SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "SubWise",
    "applicationCategory": "FinanceApplication",
    "applicationSubCategory": "Budget Management",
    "operatingSystem": "Web, iOS, Android",
    "offers": [
      {
        "@type": "Offer",
        "name": "Free Plan",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Track up to 3 subscriptions with basic features"
      },
      {
        "@type": "Offer",
        "name": "Premium Monthly",
        "price": "5.00",
        "priceCurrency": "USD",
        "priceValidUntil": "2025-12-31",
        "description": "Unlimited subscriptions with advanced analytics"
      },
      {
        "@type": "Offer",
        "name": "Premium Annual",
        "price": "42.00",
        "priceCurrency": "USD",
        "priceValidUntil": "2025-12-31",
        "description": "Unlimited subscriptions with advanced analytics, billed annually"
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "127"
    },
    "description": "Track, analyze, and manage all your subscriptions in one place. Get smart alerts, spending insights, and never miss a renewal.",
    "featureList": [
      "Subscription Tracking",
      "Renewal Reminders",
      "Spending Analytics",
      "Budget Management",
      "Smart Alerts",
      "Export Reports",
      "Multi-Currency Support"
    ],
    "screenshot": "https://usesubwise.app/og-image.png",
    "url": "https://usesubwise.app",
    "author": {
      "@type": "Organization",
      "name": "SubWise"
    }
  };

  return (
    <>
      {/* JSON-LD for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Testimonials />
        <CTABanner />
      </main>
      <Footer />
    </>
  );
}
