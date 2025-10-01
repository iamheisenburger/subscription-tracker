// TEMPORARY: Using Clerk's PricingTable for development testing
// PRODUCTION: Will revert to CustomPricingV2 when ready
import { ClerkPricingTemporary } from '@/components/landing/clerk-pricing-temporary'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <div className="pt-16 xs:pt-20 sm:pt-24">
        <ClerkPricingTemporary />
      </div>
      <Footer />
    </>
  )
}
