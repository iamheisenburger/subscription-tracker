import { PricingTable } from "@clerk/nextjs";

export const Pricing = () => {
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

        {/* Clerk Pricing Table */}
        <div className="max-w-4xl mx-auto">
          <PricingTable 
            newSubscriptionRedirectUrl="/dashboard"
            ctaPosition="bottom"
            collapseFeatures={false}
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
            appearance={{
              variables: {
                colorPrimary: "hsl(var(--primary))",
                colorText: "hsl(var(--foreground))",
                colorBackground: "hsl(var(--background))",
                fontFamily: "var(--font-sans)",
                borderRadius: "var(--radius)",
              },
              elements: {
                card: {
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--card))",
                  borderRadius: "var(--radius)",
                  boxShadow: "var(--shadow)",
                  fontFamily: "var(--font-sans)"
                },
                cardHeader: {
                  color: "hsl(var(--card-foreground))",
                  fontFamily: "var(--font-sans)"
                },
                cardContent: {
                  color: "hsl(var(--card-foreground))",
                  fontFamily: "var(--font-sans)"
                },
                button: {
                  fontFamily: "var(--font-sans)",
                  borderRadius: "var(--radius)",
                },
                buttonPrimary: {
                  backgroundColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  fontFamily: "var(--font-sans)",
                  borderRadius: "var(--radius)",
                },
                buttonSecondary: {
                  backgroundColor: "hsl(var(--secondary))",
                  color: "hsl(var(--secondary-foreground))",
                  border: "1px solid hsl(var(--border))",
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