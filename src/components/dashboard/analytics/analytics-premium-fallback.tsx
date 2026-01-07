"use client";

import { Lock, PieChart, Calendar, Lightbulb, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AnalyticsPremiumFallback() {
  return (
    <div className="space-y-6">
      {/* Locked Card - Mobile app style with gradient */}
      <div className="bg-primary text-primary-foreground rounded-2xl p-7 text-center">
        <div className="w-[72px] h-[72px] rounded-full bg-primary-foreground/15 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-[22px] font-bold mb-2.5">Unlock Analytics</h2>
        <p className="text-primary-foreground/80 text-[15px] leading-relaxed mb-6 max-w-sm mx-auto">
          Get detailed insights into your spending, upcoming renewals, and personalized recommendations to save money.
        </p>
        <Link href="/dashboard/upgrade">
          <Button 
            variant="secondary" 
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-xl px-7 py-3.5 font-bold text-base h-auto"
          >
            Upgrade to Plus
          </Button>
        </Link>
      </div>

      {/* What you get with Plus - Mobile app style */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="text-[17px] font-bold mb-5">What you get with Plus</h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-[10px] bg-muted flex items-center justify-center flex-shrink-0">
              <PieChart className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[15px] mb-1">Spending Breakdown</h4>
              <p className="text-[13px] text-muted-foreground leading-[18px]">
                See exactly where your money goes by category with visual charts
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-[10px] bg-muted flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[15px] mb-1">Upcoming Renewals</h4>
              <p className="text-[13px] text-muted-foreground leading-[18px]">
                Never be surprised by a charge - see all renewals in the next 14 days
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-[10px] bg-muted flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[15px] mb-1">Smart Insights</h4>
              <p className="text-[13px] text-muted-foreground leading-[18px]">
                Get personalized tips to save money and optimize your subscriptions
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-[10px] bg-muted flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[15px] mb-1">Budget Tracking</h4>
              <p className="text-[13px] text-muted-foreground leading-[18px]">
                Set a monthly budget and get alerts when approaching your limit
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
