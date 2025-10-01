"use client";

import { PricingTable } from "@clerk/nextjs";

/**
 * TEMPORARY COMPONENT FOR DEVELOPMENT TESTING
 * 
 * This uses Clerk's native PricingTable for testing billing with Clerk's payment gateway.
 * Once we move to production with Stripe, we'll switch back to CustomPricingV2.
 * 
 * TO USE THIS:
 * 1. Go to Clerk Dashboard → Billing → Create your plans (free + premium monthly/annual)
 * 2. Copy the plan IDs and add them to your .env.local:
 *    NEXT_PUBLIC_CLERK_FREE_PLAN_ID=plan_xxx
 *    NEXT_PUBLIC_CLERK_PREMIUM_MONTHLY_ID=plan_yyy
 *    NEXT_PUBLIC_CLERK_PREMIUM_ANNUAL_ID=plan_zzz
 * 3. Replace CustomPricingV2 with ClerkPricingTemporary in pricing.tsx
 */
export function ClerkPricingTemporary() {
  return (
    <div id="pricing" className="w-full py-12 xs:py-16 px-6">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight font-sans">
            Start Free, Upgrade When Ready
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
            No hidden fees, no long-term contracts. Try Premium free for 7 days, then decide. 
            Cancel anytime with one click.
          </p>
        </div>

        {/* Clerk's PricingTable - Styled to match our theme */}
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

        {/* Trust indicators - keeping your original design */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span className="font-sans">7-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span className="font-sans">Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}

