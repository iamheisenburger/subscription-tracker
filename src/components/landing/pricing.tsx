import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with subscription tracking",
    features: [
      "Track up to 3 subscriptions",
      "Basic spending overview",
      "Email renewal reminders",
      "Manual subscription entry",
      "Email support",
    ],
    buttonText: "Get Started Free",
    buttonVariant: "outline" as const,
    href: "/sign-up",
  },
  {
    name: "Premium",
    price: "$9",
    period: "per month",
    yearlyPrice: "$7.50",
    description: "Everything you need to master your subscriptions",
    features: [
      "Unlimited subscriptions",
      "Advanced spending analytics",
      "Smart alerts & notifications",
      "Export to CSV/PDF",
      "Custom categories",
      "Advanced notifications",
      "Priority support",
      "7-day free trial",
    ],
    buttonText: "Start Free Trial",
    buttonVariant: "default" as const,
    href: "/sign-up",
    popular: true,
  },
];

export const Pricing = () => {
  return (
    <div id="pricing" className="w-full py-12 xs:py-20 px-6">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight font-sans">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
            Choose the plan that&apos;s right for you. Start free and upgrade when you need more features.
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
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  {plan.yearlyPrice && (
                    <p className="text-sm text-muted-foreground mt-1">
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
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.href} className="block">
                  <Button 
                    variant={plan.buttonVariant} 
                    className="w-full"
                    size="lg"
                  >
                    {plan.buttonText}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            ✅ 7-day free trial • ✅ No credit card required • ✅ Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
};
