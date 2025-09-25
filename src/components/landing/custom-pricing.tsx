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

        {/* Clerk's PricingTable Component */}
        <div className="max-w-4xl mx-auto">
          <PricingTable 
            newSubscriptionRedirectUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: "hsl(var(--primary))",
                colorText: "hsl(var(--foreground))",
                colorBackground: "hsl(var(--background))",
                fontFamily: "var(--font-sans)",
                borderRadius: "var(--radius)",
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
            <span className="font-sans">No credit card required</span>
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