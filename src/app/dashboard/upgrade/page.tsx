"use client";

import { PricingTable } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

/**
 * TEMPORARY: In-dashboard upgrade page using Clerk PricingTable
 * 
 * For development testing with Clerk's payment gateway.
 * Will be replaced with custom UI in production.
 */
export default function UpgradePage() {
  const router = useRouter();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-sans mb-2">
          Upgrade to Premium
        </h1>
        <p className="text-muted-foreground font-sans">
          Unlock unlimited subscriptions and advanced features
        </p>
      </div>

      {/* Clerk PricingTable - Styled to match dashboard theme */}
      <PricingTable
        appearance={{
          elements: {
            // Card styling
            card: "border-2 hover:shadow-lg transition-shadow",
            cardPrimaryPlan: "border-primary shadow-md",
            
            // Typography
            cardTitle: "text-xl font-bold font-sans",
            cardDescription: "text-sm font-sans text-muted-foreground",
            cardPrice: "text-4xl font-bold font-sans",
            cardPriceText: "text-muted-foreground font-sans",
            
            // Buttons
            cardButton: "w-full font-sans rounded-md",
            cardPrimaryButton: "bg-primary text-primary-foreground hover:bg-primary/90",
            
            // Features list
            cardFeatureList: "space-y-2",
            cardFeature: "text-sm font-sans",
            
            // Toggle
            planToggle: "bg-muted p-1.5 rounded-full border border-border/50",
            planToggleButton: "px-6 py-2.5 rounded-full font-sans font-semibold text-sm",
            planToggleButtonActive: "bg-primary text-primary-foreground shadow-sm",
            planToggleButtonInactive: "bg-transparent text-muted-foreground hover:text-foreground",
          },
          variables: {
            colorPrimary: "hsl(var(--primary))",
            colorBackground: "hsl(var(--background))",
            colorText: "hsl(var(--foreground))",
            colorTextSecondary: "hsl(var(--muted-foreground))",
            borderRadius: "0.5rem",
          }
        }}
      />

      {/* Trust indicators */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="text-green-600">✓</span>
          <span className="font-sans">7-day free trial</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-600">✓</span>
          <span className="font-sans">Cancel anytime</span>
        </div>
      </div>

      {/* Back Button */}
      <div className="text-center">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="font-sans"
        >
          ← Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
