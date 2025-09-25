import { PricingTable } from '@clerk/nextjs'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4 font-sans">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-sans">
            Start tracking your subscriptions for free, or unlock powerful features with Premium
          </p>
        </div>
        
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
        
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground font-sans">
            All plans include secure data storage and regular backups. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}
