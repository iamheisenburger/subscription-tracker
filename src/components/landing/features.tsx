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
    title: "Multi-Currency Tracking",
    description:
      "Track subscriptions in USD, EUR, GBP, CAD, and AUD with real-time exchange rates updated hourly from the European Central Bank.",
  },
  {
    icon: TrendingUp,
    title: "Advanced Analytics",
    description:
      "Visualize your spending patterns with interactive charts, track monthly/yearly trends, and identify cost-saving opportunities.",
  },
  {
    icon: Bell,
    title: "Intelligent Alerts",
    description:
      "Get renewal reminders, spending threshold alerts, and budget notifications in your preferred currency. Never overspend again.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Bank-level encryption, secure authentication via Clerk, and SOC 2 compliant infrastructure. Your financial data stays private.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description:
      "Native mobile experience with offline capability, touch-optimized interface, and Progressive Web App support.",
  },
  {
    icon: Zap,
    title: "Instant Setup",
    description:
      "Create your account in 30 seconds. Add subscriptions manually with smart category detection and automatic renewal calculations.",
  },
];

export const Features = () => {
  return (
    <div id="features" className="w-full py-12 xs:py-20 px-6">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight font-sans">
            Built For The Global Subscription Economy
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
            From Netflix to Notion, track every recurring payment with precision. 
            Real-time currency conversion, intelligent alerts, and powerful analytics in one platform.
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
