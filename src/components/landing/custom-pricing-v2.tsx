"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";
import { useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";

export const CustomPricingV2 = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  
  // Your Clerk Premium Plan ID
  const PREMIUM_PLAN_ID = "cplan_33DAB0ChNOO9L2vRGzokuOvc4dl";
  
  const freePlan = {
    name: "Free",
    description: "Perfect for getting started with subscription tracking. Track up to 3 subscriptions with essential features including spending overview, renewal reminders, and email support.",
    price: "$0",
    period: "Always free",
    features: [
      "Max Subscriptions 3",
      "Simple Spending Overview",
      "Email Support",
      "Basic Renewal Reminders",
      "Manual Subscription Entry"
    ],
    cta: "Subscribe",
    ctaLink: "/sign-up"
  };

  const premiumPlan = {
    name: "Premium",
    description: "Unlock the full power of subscription tracking. Get unlimited subscriptions, advanced analytics, smart alerts, export capabilities, custom categories, and priority support with a 7-day free trial.",
    price: billingCycle === 'monthly' ? "$5.00" : "$3.50",
    period: billingCycle === 'monthly' ? "/month" : "/month",
    originalPrice: billingCycle === 'annual' ? "$5.00" : null,
    annualNote: billingCycle === 'annual' ? "Billed annually ($42.00/year)" : "Billed monthly",
    features: [
      "Unlimited Subscriptions",
      "Smart Alerts",
      "Custom Categories",
      "Advanced Notifications",
      "Spending Trends",
      "Export CSV PDF",
      "Priority Support"
    ],
    cta: "Start 7-day free trial",
    ctaLink: `/sign-up?plan=premium&billing=${billingCycle}`,
    badge: "7-day free trial"
  };

  return (
    <div id="pricing" className="w-full py-12 xs:py-16 px-6">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight font-sans">
            Start Free, Upgrade When Ready
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
            No hidden fees, no long-term contracts. Try Premium free for 7 days, then decide. 
            Cancel anytime with one click.
          </p>
        </div>

        {/* CUSTOM TOGGLE - Properly Sized */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center bg-muted p-1.5 rounded-full border border-border/50">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`
                px-6 py-2.5 rounded-full font-sans font-semibold text-sm transition-all duration-200
                ${billingCycle === 'monthly' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
                }
              `}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`
                px-6 py-2.5 rounded-full font-sans font-semibold text-sm transition-all duration-200 relative
                ${billingCycle === 'annual' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
                }
              `}
            >
              Annual
              {billingCycle === 'annual' && (
                <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  SAVE 17%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Cards - Properly Sized */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="border border-border relative">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-xl font-bold font-sans">{freePlan.name}</CardTitle>
              <CardDescription className="mt-2 font-sans text-sm">
                {freePlan.description}
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold font-sans">{freePlan.price}</span>
                <p className="text-xs text-muted-foreground mt-1 font-sans">{freePlan.period}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {freePlan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-sans">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href={freePlan.ctaLink} className="block w-full mt-6">
                <Button variant="outline" className="w-full font-sans">
                  {freePlan.cta}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="border-2 border-primary relative shadow-md">
            {premiumPlan.badge && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold font-sans shadow-md">
                  ✨ {premiumPlan.badge}
                </span>
              </div>
            )}
            <CardHeader className="text-center pb-6 pt-6">
              <CardTitle className="text-xl font-bold font-sans">{premiumPlan.name}</CardTitle>
              <CardDescription className="mt-2 font-sans text-sm">
                {premiumPlan.description}
              </CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline justify-center gap-1.5">
                  {premiumPlan.originalPrice && (
                    <span className="text-xl text-muted-foreground line-through font-sans">
                      {premiumPlan.originalPrice}
                    </span>
                  )}
                  <span className="text-4xl font-bold font-sans">{premiumPlan.price}</span>
                  <span className="text-base text-muted-foreground font-sans">{premiumPlan.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-sans">{premiumPlan.annualNote}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {premiumPlan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-sans">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {/* Conditional CTA based on sign-in status */}
              {/* For signed-in users: Use CheckoutButton to open checkout drawer */}
              <SignedIn>
                <CheckoutButton
                  planId={PREMIUM_PLAN_ID}
                  planPeriod={billingCycle === 'monthly' ? 'month' : 'annual'}
                  onSubscriptionComplete={() => {
                    console.log('Subscription completed!');
                  }}
                  newSubscriptionRedirectUrl="/dashboard"
                  checkoutProps={{
                    appearance: {
                      elements: {
                        // Container and positioning
                        rootBox: "!bg-background !z-[9999]",
                        modalContent: "!max-w-[95vw] sm:!max-w-[480px] !mx-auto !my-4 sm:!my-8",
                        modalCloseButton: "!text-foreground hover:!bg-muted !top-4 !right-4 !z-[10000]",
                        
                        // Card styling
                        card: "!bg-card !border-2 !border-border !shadow-xl !rounded-lg",
                        
                        // Header with high contrast
                        headerTitle: "!text-foreground !font-bold !text-xl font-sans",
                        headerSubtitle: "!text-foreground !font-medium !text-base font-sans",
                        
                        // All text elements with high contrast
                        text: "!text-foreground font-sans",
                        
                        // Form labels - very visible
                        formFieldLabel: "!text-foreground !font-semibold !text-sm font-sans !mb-2",
                        
                        // Form inputs - high contrast
                        formFieldInput: "!bg-background !border-2 !border-border !text-foreground !font-medium !text-base !min-h-[44px] !px-4",
                        
                        // Pricing text - bold and visible
                        priceText: "!text-foreground !font-bold !text-2xl font-sans",
                        
                        // Submit button - highly visible
                        formButtonPrimary: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !min-h-[52px] !text-base !font-bold !shadow-lg !rounded-lg !mt-6 !w-full",
                        
                        // Dropdown/select styling
                        selectButton: "!bg-background !border-2 !border-border !text-foreground !min-h-[44px]",
                        
                        // Footer text
                        footerText: "!text-foreground font-sans !text-sm",
                      },
                      variables: {
                        colorPrimary: "hsl(var(--primary))",
                        colorBackground: "hsl(var(--background))",
                        colorText: "hsl(var(--foreground))",
                        colorTextSecondary: "hsl(var(--foreground))",
                        colorInputBackground: "hsl(var(--background))",
                        colorInputText: "hsl(var(--foreground))",
                        fontFamily: "var(--font-sans)",
                        fontSize: "16px",
                        borderRadius: "0.5rem",
                      }
                    }
                  }}
                >
                  <Button className="w-full font-sans mt-6">
                    {premiumPlan.cta}
                  </Button>
                </CheckoutButton>
              </SignedIn>
              
              {/* For non-signed-in users: Link to sign-up, then Clerk handles checkout */}
              <SignedOut>
                <Link href={premiumPlan.ctaLink} className="block w-full mt-6">
                  <Button className="w-full font-sans">
                    {premiumPlan.cta}
                  </Button>
                </Link>
              </SignedOut>
            </CardContent>
          </Card>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span className="font-sans">7-day free trial</span>
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

