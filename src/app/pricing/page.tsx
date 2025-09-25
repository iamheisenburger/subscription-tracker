import { CustomPricing } from '@/components/landing/custom-pricing'

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
        
        <CustomPricing />
        
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground font-sans">
            All plans include secure data storage and regular backups. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}
