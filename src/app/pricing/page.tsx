import { PricingTable } from '@clerk/nextjs'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start tracking your subscriptions for free, or unlock powerful features with Premium
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <PricingTable />
        </div>
        
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            All plans include secure data storage and regular backups. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}
