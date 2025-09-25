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

        {/* Clerk's PricingTable - Enhanced Theme & Visibility */}
        <div className="max-w-4xl mx-auto">
          <PricingTable 
            newSubscriptionRedirectUrl="/dashboard"
            appearance={{
              variables: {
                // Enhanced theme colors for better visibility
                colorPrimary: "hsl(var(--primary))",
                colorText: "hsl(var(--foreground))",
                colorTextSecondary: "hsl(var(--muted-foreground))",
                colorBackground: "hsl(var(--card))",
                colorInputBackground: "hsl(var(--input))",
                colorInputText: "hsl(var(--foreground))",
                fontFamily: "var(--font-sans)",
                borderRadius: "var(--radius)",
                
                // Improved contrast for switches and toggles
                colorNeutral: "hsl(var(--muted))",
                colorSuccess: "hsl(var(--primary))",
                colorDanger: "hsl(var(--destructive))",
                
                // Enhanced border and shadow
                colorBorder: "hsl(var(--border))",
                colorShimmer: "hsl(var(--muted))",
              },
              elements: {
                // Enhanced card styling
                rootBox: "bg-card border border-border rounded-lg shadow-sm",
                card: "bg-card border border-border rounded-lg shadow-sm",
                
                // Better text contrast
                headerTitle: "font-sans font-bold text-foreground",
                headerSubtitle: "font-sans text-muted-foreground",
                text: "font-sans text-foreground",
                
                // Enhanced pricing text
                priceText: "font-sans font-bold text-3xl text-foreground",
                
                // Improved buttons with better contrast
                formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 font-sans font-medium rounded-md transition-all duration-200 shadow-sm border-0 min-h-[44px]",
                formButtonSecondary: "bg-muted text-foreground hover:bg-muted/80 font-sans font-medium rounded-md transition-all duration-200 shadow-sm border border-border min-h-[44px]",
                
                // Enhanced features list
                pricingFeature: "font-sans text-sm text-foreground flex items-center gap-2",
                
                // Better badge styling
                badge: "bg-primary text-primary-foreground font-sans text-xs font-medium px-2 py-1 rounded-full",
                
                // Improved switch/toggle visibility - CRITICAL FIX
                switchThumb: "bg-background border-2 border-primary shadow-sm",
                switchTrackChecked: "bg-primary",
                switchTrackUnchecked: "bg-muted border border-border",
                
                // Enhanced input styling
                formFieldInput: "bg-input border border-border text-foreground rounded-md font-sans",
                formFieldLabel: "text-foreground font-sans font-medium",
                
                // Better dividers and separators
                divider: "border-border",
              }
            }}
            checkoutProps={{
              appearance: {
                variables: {
                  colorPrimary: "hsl(var(--primary))",
                  colorText: "hsl(var(--foreground))",
                  colorBackground: "hsl(var(--background))",
                  colorInputBackground: "hsl(var(--input))",
                  fontFamily: "var(--font-sans)",
                  borderRadius: "var(--radius)",
                  colorBorder: "hsl(var(--border))",
                },
                elements: {
                  rootBox: "bg-background",
                  card: "bg-card border border-border rounded-lg shadow-lg",
                  formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 font-sans font-medium rounded-md transition-all duration-200 min-h-[44px]",
                  text: "text-foreground font-sans",
                  formFieldInput: "bg-input border border-border text-foreground rounded-md font-sans",
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