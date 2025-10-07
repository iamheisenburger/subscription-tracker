// SWITCHED BACK TO CUSTOM PRICING - Works with Clerk billing in production!
// The custom UI redirects to Clerk's sign-up/checkout flow
import { CustomPricingV2 } from "./custom-pricing-v2";

export const Pricing = () => {
  // Custom pricing table with Clerk integration
  return <CustomPricingV2 />;
};