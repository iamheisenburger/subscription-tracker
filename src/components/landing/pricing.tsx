// TEMPORARY: Using Clerk's PricingTable for development testing
// PRODUCTION: Uncomment CustomPricingV2Production when ready
import { ClerkPricingTemporary } from "./clerk-pricing-temporary";
// import { CustomPricingV2 } from "./custom-pricing-v2"; // Will use in production

export const Pricing = () => {
  // For development testing with Clerk's payment gateway
  return <ClerkPricingTemporary />;
  
  // For production with Stripe (switch when ready)
  // return <CustomPricingV2 />;
};