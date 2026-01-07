"use client";

import { Lock, TrendingUp, Calendar, PieChart, Lightbulb } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AnalyticsPremiumFallback() {
  return (
    <div className="space-y-6">
      {/* Locked Card - Dark gradient like mobile app */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-[20px] p-8 text-center">
        <div className="w-[72px] h-[72px] bg-primary-foreground/15 rounded-full flex items-center justify-center mx-auto mb-5">
          <Lock className="w-10 h-10 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-primary-foreground mb-3">
          Unlock Analytics
        </h2>
        <p className="text-primary-foreground/70 mb-6 max-w-md mx-auto leading-relaxed">
          Get detailed insights into your spending, upcoming renewals, and personalized recommendations to save money.
        </p>
        <Link href="/pricing">
          <Button 
            variant="secondary" 
            size="lg"
            className="rounded-xl font-bold px-8"
          >
            Upgrade to Plus
          </Button>
        </Link>
      </div>

      {/* Features Preview */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="text-lg font-bold mb-5">What you get with Plus</h3>
        
        <div className="space-y-5">
          <FeatureItem 
            icon={PieChart}
            title="Spending Breakdown"
            description="See exactly where your money goes by category with visual charts"
          />
          <FeatureItem 
            icon={Calendar}
            title="Upcoming Renewals"
            description="Never be surprised by a charge - see all renewals in the next 14 days"
          />
          <FeatureItem 
            icon={Lightbulb}
            title="Smart Insights"
            description="Get personalized tips to save money and optimize your subscriptions"
          />
          <FeatureItem 
            icon={TrendingUp}
            title="Budget Tracking"
            description="Set a monthly budget and get alerts when approaching your limit"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-foreground" />
      </div>
      <div>
        <h4 className="font-semibold text-[15px] mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
