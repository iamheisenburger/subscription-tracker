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

      {/* Clerk PricingTable - Enhanced styling for better visibility */}
      <PricingTable
        appearance={{
          elements: {
            // Card styling with better contrast
            card: "!bg-card !border-2 !border-border hover:shadow-lg transition-shadow",
            cardPrimaryPlan: "!border-primary shadow-md",
            
            // Typography with explicit colors for light mode
            cardTitle: "!text-xl font-bold font-sans !text-foreground",
            cardDescription: "!text-sm font-sans !text-muted-foreground",
            cardPrice: "!text-4xl font-bold font-sans !text-foreground",
            cardPriceText: "!text-base !text-muted-foreground font-sans",
            
            // Buttons with high contrast
            cardButton: "!w-full font-sans !rounded-md !min-h-[44px] !text-base !font-semibold",
            cardPrimaryButton: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !shadow-sm",
            cardSecondaryButton: "!bg-muted !text-foreground hover:!bg-muted/80 !border-2 !border-border",
            
            // Features list with better readability
            cardFeatureList: "space-y-2 !mt-4",
            cardFeature: "!text-sm font-sans !text-foreground !flex !items-center !gap-2",
            cardFeatureIcon: "!text-primary",
            
            // Toggle with high visibility
            planToggle: "!bg-muted !p-1.5 !rounded-full !border-2 !border-border",
            planToggleButton: "!px-6 !py-2.5 !rounded-full font-sans font-semibold !text-sm !min-h-[40px]",
            planToggleButtonActive: "!bg-primary !text-primary-foreground !shadow-sm !font-bold",
            planToggleButtonInactive: "!bg-transparent !text-muted-foreground hover:!text-foreground",
            
            // Container and layout
            root: "!w-full",
            planGrid: "!gap-6",
          },
          variables: {
            colorPrimary: "hsl(var(--primary))",
            colorBackground: "hsl(var(--background))",
            colorText: "hsl(var(--foreground))",
            colorTextSecondary: "hsl(var(--muted-foreground))",
            colorInputBackground: "hsl(var(--input))",
            colorInputText: "hsl(var(--foreground))",
            colorDanger: "hsl(var(--destructive))",
            colorSuccess: "hsl(var(--primary))",
            colorNeutral: "hsl(var(--muted))",
            borderRadius: "0.5rem",
            fontFamily: "var(--font-sans)",
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
