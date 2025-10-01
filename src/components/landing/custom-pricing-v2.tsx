"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";

export const CustomPricingV2 = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  
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
    price: billingCycle === 'monthly' ? "$9.00" : "$7.50",
    period: billingCycle === 'monthly' ? "/month" : "/month",
    originalPrice: billingCycle === 'annual' ? "$9.00" : null,
    annualNote: billingCycle === 'annual' ? "Billed annually ($90.00/year)" : "Billed monthly",
    features: [
      "Unlimited Subscriptions",
      "Smart Alerts",
      "Custom Categories",
      "Advanced Notifications",
      "Spending Trends",
      "Export CSV PDF",
      "Priority Support",
      "Max Subscriptions 3"
    ],
    cta: "Start 7-day free trial",
    ctaLink: `/sign-up?plan=premium&billing=${billingCycle}`,
    badge: "7-day free trial"
  };

  return (
    <div id="pricing" className="w-full py-12 xs:py-20 px-6">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight font-sans">
            Start Free, Upgrade When Ready
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
            No hidden fees, no long-term contracts. Try Premium free for 7 days, then decide. 
            Cancel anytime with one click.
          </p>
        </div>

        {/* CUSTOM TOGGLE - Full Control */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-muted p-2 rounded-full border-2 border-border shadow-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`
                px-8 py-3 rounded-full font-sans font-bold text-base uppercase tracking-wide transition-all duration-300
                ${billingCycle === 'monthly' 
                  ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                  : 'bg-transparent text-muted-foreground hover:text-foreground hover:scale-102'
                }
              `}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`
                px-8 py-3 rounded-full font-sans font-bold text-base uppercase tracking-wide transition-all duration-300 relative
                ${billingCycle === 'annual' 
                  ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                  : 'bg-transparent text-muted-foreground hover:text-foreground hover:scale-102'
                }
              `}
            >
              Annual
              {billingCycle === 'annual' && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  SAVE 17%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="border-2 border-border relative">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold font-sans">{freePlan.name}</CardTitle>
              <CardDescription className="mt-2 font-sans text-base">
                {freePlan.description}
              </CardDescription>
              <div className="mt-6">
                <span className="text-5xl font-bold font-sans">{freePlan.price}</span>
                <p className="text-sm text-muted-foreground mt-2 font-sans">{freePlan.period}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {freePlan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-sans">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href={freePlan.ctaLink} className="block w-full mt-8">
                <Button variant="outline" size="lg" className="w-full font-sans font-semibold">
                  {freePlan.cta}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="border-2 border-primary relative shadow-xl">
            {premiumPlan.badge && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-bold font-sans shadow-lg">
                  ✨ {premiumPlan.badge}
                </span>
              </div>
            )}
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-2xl font-bold font-sans">{premiumPlan.name}</CardTitle>
              <CardDescription className="mt-2 font-sans text-base">
                {premiumPlan.description}
              </CardDescription>
              <div className="mt-6">
                <div className="flex items-baseline justify-center gap-2">
                  {premiumPlan.originalPrice && (
                    <span className="text-2xl text-muted-foreground line-through font-sans">
                      {premiumPlan.originalPrice}
                    </span>
                  )}
                  <span className="text-5xl font-bold font-sans">{premiumPlan.price}</span>
                  <span className="text-xl text-muted-foreground font-sans">{premiumPlan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 font-sans">{premiumPlan.annualNote}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {premiumPlan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-sans font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href={premiumPlan.ctaLink} className="block w-full mt-8">
                <Button size="lg" className="w-full font-sans font-semibold text-base">
                  {premiumPlan.cta}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-6 text-sm text-muted-foreground">
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

