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
                  borderRadius: "0.5rem",
                }
              }
            }}
            appearance={{
              variables: {
                colorPrimary: "hsl(var(--primary))",
                colorText: "hsl(var(--foreground))",
                colorBackground: "hsl(var(--background))",
                borderRadius: "0.5rem",
              },
              elements: {
                card: {
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--card))",
                  borderRadius: "0.5rem",
                  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
                },
                cardHeader: {
                  color: "hsl(var(--card-foreground))"
                }
              }
            }}
          />
        </div>
        
        {/* Trust indicators */}
        <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span>7-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span>Cancel anytime</span>
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
