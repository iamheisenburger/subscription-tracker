"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";
import type { CommerceSubscriptionPlanPeriod } from "@clerk/types";
import { plusPlanId } from "@/lib/clerk-plan-ids";

export const CustomPricingV2 = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const planPeriodValue = billingCycle === 'monthly' ? 'month' : 'annual';
  const clerkPlanPeriod = planPeriodValue as unknown as CommerceSubscriptionPlanPeriod;

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
    cta: "Get Started",
    ctaLink: "/sign-up"
  };

  const plusPlan = {
    name: "Plus",
    description: "Unlock unlimited subscriptions, advanced analytics, smart alerts, and export capabilities with priority support.",
    price: billingCycle === 'monthly' ? "$5.00" : "$3.50",
    period: billingCycle === 'monthly' ? "/month" : "/month",
    originalPrice: billingCycle === 'annual' ? "$5.00" : null,
    annualNote: billingCycle === 'annual' ? "Billed annually ($42.00/year)" : "Billed monthly",
    features: [
      "Unlimited manual subscriptions",
      "Analytics & CSV/PDF export",
      "Custom categories & reminders",
      "Smart alerts (manual detections)",
      "Priority email support"
    ],
    cta: "Start 7-day free trial",
    ctaLink: `/sign-up?plan=plus&billing=${billingCycle}`,
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
            No hidden fees, no long-term contracts. Try Plus free for 7 days, then decide.
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

        {/* Pricing Cards - 2 Column Grid (Free + Plus only) */}
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

              {/* Conditional CTA based on sign-in status */}
              {/* For signed-in users: Use CheckoutButton to open checkout drawer */}
              <SignedIn>
                <CheckoutButton
                  planId={plusPlanId}
                  planPeriod={clerkPlanPeriod}
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

              {/* For non-signed-in users: Link to sign-up, then Clerk handles checkout */}
              <SignedOut>
                <Link href={plusPlan.ctaLink} className="block w-full mt-6">
                  <Button className="w-full font-sans">
                    {plusPlan.cta}
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

