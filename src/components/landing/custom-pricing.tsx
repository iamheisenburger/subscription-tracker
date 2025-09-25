"use client"

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle as Check } from "lucide-react";
// Temporarily removed Clerk checkout components
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for individuals getting started with subscription tracking",
    features: [
      "Track up to 3 subscriptions",
      "Multi-currency support (5 currencies)",
      "Basic spending analytics",
      "Email renewal reminders",
      "Manual subscription entry",
      "Standard email support",
    ],
    planId: null, // No plan ID for free
    buttonText: "Start Free",
    buttonVariant: "outline" as const,
  },
  {
    name: "Premium",
    price: "$9",
    period: "per month",
    yearlyPrice: "$7.50",
    description: "For power users who want complete subscription control",
    features: [
      "Unlimited subscriptions",
      "Advanced analytics dashboard", 
      "Smart spending threshold alerts",
      "Real-time budget management",
      "Export to CSV/PDF reports",
      "Custom categories & tagging",
      "Priority email support (12hr response)",
      "Savings tracking & celebration",
      "7-day free trial included",
    ],
           planId: process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID || "cplan_32xfUNaavPmbOI3V7AtOq7EiPqM", // Your Clerk plan ID
    buttonText: "Start 7-Day Free Trial",
    buttonVariant: "default" as const,
    popular: true,
  },
];

export const CustomPricing = () => {
  return (
    <div id="pricing" className="w-full py-12 xs:py-20 px-6">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight font-sans">
            Start free, upgrade when ready
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
            No hidden fees, no long-term contracts. Try Premium free for 7 days, then decide. 
            Cancel anytime with one click.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-sans">{plan.name}</CardTitle>
                <CardDescription className="text-base font-sans">{plan.description}</CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold font-sans">{plan.price}</span>
                    <span className="text-muted-foreground font-sans">/{plan.period}</span>
                  </div>
                  {plan.yearlyPrice && (
                    <p className="text-sm text-muted-foreground mt-1 font-sans">
                      or {plan.yearlyPrice}/month billed annually
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-sans">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Free Plan Button */}
                {!plan.planId && (
                  <Link href="/sign-up" className="block">
                    <Button 
                      variant={plan.buttonVariant} 
                      className="w-full font-sans"
                      size="lg"
                    >
                      {plan.buttonText}
                    </Button>
                  </Link>
                )}

                {/* Premium Plan Buttons - Temporary fallback to sign-up */}
                {plan.planId && (
                  <Link href="/sign-up" className="block">
                    <Button 
                      variant={plan.buttonVariant} 
                      className="w-full font-sans"
                      size="lg"
                    >
                      {plan.buttonText}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span className="font-sans">7-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span className="font-sans">No credit card required</span>
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
