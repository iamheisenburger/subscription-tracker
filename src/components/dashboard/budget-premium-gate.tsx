/* eslint-disable react/no-unescaped-entities */
"use client";

import { Crown, DollarSign, TrendingUp, AlertTriangle, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserTier } from "@/hooks/use-user-tier";

interface BudgetPremiumGateProps {
  children: React.ReactNode;
}

export function BudgetPremiumGate({ children }: BudgetPremiumGateProps) {
  const { isLoading, isPremium } = useUserTier();

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Card className="rounded-2xl border border-border">
          <CardHeader>
            <div className="h-6 bg-muted rounded-lg w-1/3"></div>
            <div className="h-4 bg-muted rounded-lg w-2/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded-lg"></div>
              <div className="h-4 bg-muted rounded-lg w-3/4"></div>
              <div className="h-10 bg-muted rounded-xl"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show upgrade prompt for free users - Mobile app style
  if (!isPremium) {
    return (
      <Card className="rounded-2xl border border-border overflow-hidden">
        {/* Dark header section - matches mobile app */}
        <div className="bg-primary text-primary-foreground p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary-foreground/20 rounded-2xl flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">Unlock Budget Management</h2>
          <p className="text-primary-foreground/80 text-center text-sm">
            Take control of your subscription spending with Plus
          </p>
        </div>

        {/* Features section */}
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-xl">
              <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Smart Budget Thresholds</h3>
                <p className="text-sm text-muted-foreground">
                  Set monthly and yearly spending limits with intelligent tracking
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-xl">
              <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Spending Alerts</h3>
                <p className="text-sm text-muted-foreground">
                  Get notified when you're approaching or exceeding your budget
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-xl">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Detailed Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Track spending by category and identify savings opportunities
                </p>
              </div>
            </div>
          </div>

          {/* CTA section */}
          <div className="space-y-3">
            <Link href="/dashboard/upgrade" className="block">
              <Button className="w-full rounded-xl h-12 font-semibold">
                <Crown className="mr-2 h-4 w-4" />
                Start 7-Day Free Trial
              </Button>
            </Link>
            <Link href="/dashboard" className="block">
              <Button variant="outline" className="w-full rounded-xl h-12 font-medium border-border/50">
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            ✅ 7-day free trial • ✅ Cancel anytime
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show actual budget content for premium users
  return <>{children}</>;
}
