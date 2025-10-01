import { CustomPricingV2 } from '@/components/landing/custom-pricing-v2'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <div className="pt-16 xs:pt-20 sm:pt-24">
        <CustomPricingV2 />
      </div>
      <Footer />
    </>
  )
}
