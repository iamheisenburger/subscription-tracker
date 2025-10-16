"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { SignedIn } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";

/**
 * Custom Pricing Table for Dashboard Upgrade Page
 * Uses Clerk's CheckoutButton to open checkout drawer directly
 */
export const CustomPricingDashboard = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  // Clerk Plan IDs
  const PLUS_PLAN_ID = "cplan_33b_oku0vc4d1";
  const AUTOMATE_PLAN_ID = "cplan_349_aaGMut0q1";

  const freePlan = {
    name: "Free - Track",
    description: "Perfect for getting started with subscription tracking. Track up to 3 subscriptions with essential features.",
    price: "$0",
    period: "Always free",
    features: [
      "Up to 3 manual subscriptions",
      "Basic email reminders",
      "Simple spending overview",
      "Community support"
    ],
    cta: "Current Plan",
    isCurrentPlan: true
  };

  const plusPlan = {
    name: "Plus",
    description: "Unlock unlimited subscriptions, advanced analytics, smart alerts, and export capabilities with priority support.",
    price: billingCycle === 'monthly' ? "$9.00" : "$6.58",
    period: billingCycle === 'monthly' ? "/month" : "/month",
    originalPrice: billingCycle === 'annual' ? "$9.00" : null,
    annualNote: billingCycle === 'annual' ? "Billed annually ($79.00/year)" : "Billed monthly",
    features: [
      "Unlimited manual subscriptions",
      "Multi-currency analytics",
      "CSV/PDF export",
      "Custom categories & smart alerts",
      "Priority email support"
    ],
    cta: "Start 7-day free trial",
    badge: "7-day free trial"
  };

  const automatePlan = {
    name: "Automate",
    description: "Everything in Plus + automated bank sync, subscription detection, price change alerts, and cancel assistant.",
    price: billingCycle === 'monthly' ? "$9.00" : "$6.58",
    period: billingCycle === 'monthly' ? "/month" : "/month",
    originalPrice: billingCycle === 'annual' ? "$9.00" : null,
    annualNote: billingCycle === 'annual' ? "Billed annually ($79.00/year)" : "Billed monthly",
    features: [
      "Everything in Plus",
      "1 bank connection (up to 3 accounts)",
      "Auto subscription detection",
      "Price change & duplicate alerts",
      "Email receipt parsing",
      "Cancel Assistant (self-serve)",
      "Calendar export + Push/SMS",
      "Daily sync & renewal prediction"
    ],
    cta: "Start 7-day free trial",
    badge: "Most Popular"
  };


  return (
    <div id="pricing" className="w-full">
      <div className="max-w-screen-xl mx-auto">
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

        {/* Pricing Cards - 3 Column Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
              <Button variant="outline" className="w-full font-sans mt-6" disabled>
                {freePlan.cta}
              </Button>
            </CardContent>
          </Card>

          {/* Plus Plan */}
          <Card className="border border-border relative">
            {plusPlan.badge && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold font-sans shadow-md">
                  ✨ {plusPlan.badge}
                </span>
              </div>
            )}
            <CardHeader className="text-center pb-6 pt-6">
              <CardTitle className="text-xl font-bold font-sans">{plusPlan.name}</CardTitle>
              <CardDescription className="mt-2 font-sans text-sm">
                {plusPlan.description}
              </CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline justify-center gap-1.5">
                  {plusPlan.originalPrice && (
                    <span className="text-xl text-muted-foreground line-through font-sans">
                      {plusPlan.originalPrice}
                    </span>
                  )}
                  <span className="text-4xl font-bold font-sans">{plusPlan.price}</span>
                  <span className="text-base text-muted-foreground font-sans">{plusPlan.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-sans">{plusPlan.annualNote}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {plusPlan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-sans">{feature}</span>
                  </li>
                ))}
              </ul>
              {/* Clerk CheckoutButton - Opens checkout drawer */}
              <SignedIn>
                <CheckoutButton
                  planId={PLUS_PLAN_ID}
                  planPeriod={billingCycle === 'monthly' ? 'month' : 'annual'}
                  onSubscriptionComplete={() => {
                    // Force redirect to dashboard
                    window.location.href = '/dashboard';
                  }}
                  newSubscriptionRedirectUrl="/dashboard"
                  checkoutProps={{
                    appearance: {
                      elements: {
                        // ONLY override the submit button color - everything else stays Clerk default
                        formButtonPrimary: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-semibold !shadow-md",
                      }
                    }
                  }}
                >
                  <Button className="w-full font-sans mt-6">
                    {plusPlan.cta}
                  </Button>
                </CheckoutButton>
              </SignedIn>
            </CardContent>
          </Card>

          {/* Automate Plan - Most Popular */}
          <Card className="border-2 border-primary relative shadow-md">
            {automatePlan.badge && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold font-sans shadow-md">
                  ⚡ {automatePlan.badge}
                </span>
              </div>
            )}
            <CardHeader className="text-center pb-6 pt-6">
              <CardTitle className="text-xl font-bold font-sans">{automatePlan.name}</CardTitle>
              <CardDescription className="mt-2 font-sans text-sm">
                {automatePlan.description}
              </CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline justify-center gap-1.5">
                  {automatePlan.originalPrice && (
                    <span className="text-xl text-muted-foreground line-through font-sans">
                      {automatePlan.originalPrice}
                    </span>
                  )}
                  <span className="text-4xl font-bold font-sans">{automatePlan.price}</span>
                  <span className="text-base text-muted-foreground font-sans">{automatePlan.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-sans">{automatePlan.annualNote}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {automatePlan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-sans">{feature}</span>
                  </li>
                ))}
              </ul>
              {/* Clerk CheckoutButton - Opens checkout drawer */}
              <SignedIn>
                <CheckoutButton
                  planId={AUTOMATE_PLAN_ID}
                  planPeriod={billingCycle === 'monthly' ? 'month' : 'annual'}
                  onSubscriptionComplete={() => {
                    // Force redirect to dashboard
                    window.location.href = '/dashboard';
                  }}
                  newSubscriptionRedirectUrl="/dashboard"
                  checkoutProps={{
                    appearance: {
                      elements: {
                        // ONLY override the submit button color - everything else stays Clerk default
                        formButtonPrimary: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-semibold !shadow-md",
                      }
                    }
                  }}
                >
                  <Button className="w-full font-sans mt-6">
                    {automatePlan.cta}
                  </Button>
                </CheckoutButton>
              </SignedIn>
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

