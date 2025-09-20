import {
  CreditCard,
  TrendingUp,
  Bell,
  Shield,
  Smartphone,
  Zap,
} from "lucide-react";
import React from "react";

const features = [
  {
    icon: CreditCard,
    title: "Track All Subscriptions",
    description:
      "Manage all your subscriptions in one place. Never lose track of what you're paying for again.",
  },
  {
    icon: TrendingUp,
    title: "Spending Analytics",
    description:
      "Get detailed insights into your subscription spending with beautiful charts and trends.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Receive timely alerts before renewals, price changes, and when you're overspending.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Your financial data is encrypted and secure. We never share your information with third parties.",
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description:
      "Access your subscription dashboard anywhere with our mobile-first responsive design.",
  },
  {
    icon: Zap,
    title: "Quick Setup",
    description:
      "Get started in minutes. Add subscriptions manually or import from your bank statements.",
  },
];

export const Features = () => {
  return (
    <div id="features" className="w-full py-12 xs:py-20 px-6">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight font-sans">
            Everything you need to manage subscriptions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
            SubTracker provides all the tools you need to take control of your recurring payments
            and optimize your spending.
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col bg-card border rounded-xl py-6 px-5 hover:shadow-lg transition-shadow"
            >
              <div className="mb-4 h-12 w-12 flex items-center justify-center bg-primary/10 rounded-full">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 font-sans">{feature.title}</h3>
              <p className="text-muted-foreground text-[15px] leading-relaxed font-sans">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
