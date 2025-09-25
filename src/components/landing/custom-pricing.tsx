"use client"

import { PricingTable } from "@clerk/nextjs";

export const CustomPricing = () => {
  return (
    <div id="pricing" className="w-full py-12 xs:py-20 px-6">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight font-sans">
            Start free, upgrade when ready
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
            No hidden fees, no long-term contracts. Try Premium free for 7 days, then decide. 
            Cancel anytime with one click.
          </p>
        </div>

        {/* Clerk's PricingTable - Fully Customized */}
        <div className="max-w-4xl mx-auto">
          <PricingTable 
            newSubscriptionRedirectUrl="/dashboard"
            appearance={{
              variables: {
                // Use your theme colors
                colorPrimary: "hsl(var(--primary))",
                colorText: "hsl(var(--foreground))",
                colorTextSecondary: "hsl(var(--muted-foreground))",
                colorBackground: "hsl(var(--background))",
                colorInputBackground: "hsl(var(--background))",
                colorInputText: "hsl(var(--foreground))",
                fontFamily: "var(--font-sans)",
                borderRadius: "var(--radius)",
                // Card styling
                colorNeutral: "hsl(var(--muted))",
                colorSuccess: "hsl(var(--primary))",
                colorDanger: "hsl(var(--destructive))",
                colorWarning: "hsl(var(--warning))",
                // Spacing
                spacingUnit: "1rem",
              },
              elements: {
                // Style the pricing table container
                card: "shadow-lg border border-border bg-card",
                headerTitle: "font-sans font-bold",
                headerSubtitle: "font-sans text-muted-foreground",
                // Style pricing text
                priceText: "font-sans font-bold text-4xl",
                // Style buttons
                formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 font-sans rounded-md transition-colors",
                formButtonSecondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 font-sans rounded-md transition-colors",
                // Style features list
                pricingFeature: "font-sans text-sm",
                // Style the overall layout
                rootBox: "rounded-lg",
                // Badge for popular plan
                badge: "bg-primary text-primary-foreground font-sans text-xs",
              }
            }}
            checkoutProps={{
              appearance: {
                variables: {
                  colorPrimary: "hsl(var(--primary))",
                  colorText: "hsl(var(--foreground))",
                  colorBackground: "hsl(var(--background))",
                  fontFamily: "var(--font-sans)",
                  borderRadius: "var(--radius)",
                }
              }
            }}
          />
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span className="font-sans">7-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span className="font-sans">No credit card required for free</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span className="font-sans">Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
};