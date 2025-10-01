"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function UpgradePage() {
  const { user } = useUser();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async (subscriptionType: 'monthly' | 'annual') => {
    if (!user?.id) {
      toast.error("Please sign in to upgrade");
      return;
    }
    
    setIsUpgrading(true);
    
    try {
      // For development: Just upgrade the tier
      const response = await fetch('/api/admin/set-subscription-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionType }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Successfully upgraded to Premium!");
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        throw new Error(result.error || 'Upgrade failed');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error("Upgrade failed. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const premiumFeatures = [
    "Unlimited Subscriptions",
    "Advanced Analytics & Spending Trends",
    "Smart Alerts & Notifications",
    "Export to CSV/PDF",
    "Custom Categories",
    "Priority Support",
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-sans">
          Upgrade to Premium
        </h1>
        <p className="text-muted-foreground font-sans">
          Unlock unlimited subscriptions and advanced features
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center bg-muted p-1.5 rounded-full border border-border/50">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2.5 rounded-full font-sans font-semibold text-sm transition-all duration-200 ${
              billingCycle === 'monthly' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'bg-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2.5 rounded-full font-sans font-semibold text-sm transition-all duration-200 relative ${
              billingCycle === 'annual' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'bg-transparent text-muted-foreground hover:text-foreground'
            }`}
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

      {/* Pricing Card */}
      <Card className="border-2 border-primary relative">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold font-sans shadow-md">
            ✨ 7-day free trial
          </span>
        </div>
        <CardHeader className="text-center pb-6 pt-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold font-sans">Premium</CardTitle>
          <CardDescription className="text-base font-sans mt-2">
            Unlock the full power of subscription tracking
          </CardDescription>
          <div className="mt-6">
            <div className="flex items-baseline justify-center gap-1.5">
              {billingCycle === 'annual' && (
                <span className="text-xl text-muted-foreground line-through font-sans">
                  $9.00
                </span>
              )}
              <span className="text-5xl font-bold font-sans">
                {billingCycle === 'monthly' ? "$9.00" : "$7.50"}
              </span>
              <span className="text-base text-muted-foreground font-sans">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2 font-sans">
              {billingCycle === 'annual' ? "Billed annually ($90.00/year)" : "Billed monthly"}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-3">
            {premiumFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm font-sans">{feature}</span>
              </li>
            ))}
          </ul>

          <Button 
            onClick={() => handleUpgrade(billingCycle)}
            disabled={isUpgrading}
            size="lg" 
            className="w-full font-sans text-base"
          >
            <Crown className="mr-2 h-5 w-5" />
            {isUpgrading ? "Upgrading..." : "Start 7-Day Free Trial"}
          </Button>

          <div className="text-center text-xs text-muted-foreground font-sans space-y-1">
            <p>✅ 7-day free trial • ✅ Cancel anytime</p>
            <p>No credit card required for trial</p>
          </div>
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="text-center">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="font-sans"
        >
          ← Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

