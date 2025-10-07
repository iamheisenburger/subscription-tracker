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
  
  // Your Clerk Premium Plan ID from production
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
    cta: "Current Plan",
    isCurrentPlan: true
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
    badge: "7-day free trial"
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
              <Button variant="outline" className="w-full font-sans mt-6" disabled>
                {freePlan.cta}
              </Button>
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
              {/* Clerk CheckoutButton - Opens checkout drawer */}
              <SignedIn>
                <CheckoutButton
                  planId={PREMIUM_PLAN_ID}
                  planPeriod={billingCycle === 'monthly' ? 'month' : 'annual'}
                  onSubscriptionComplete={() => {
                    console.log('Subscription completed! Redirecting to dashboard...');
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
                    {premiumPlan.cta}
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

