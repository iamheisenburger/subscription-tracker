"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, BarChart3, Download, Bell, FolderKanban, Shield } from "lucide-react";
import Link from "next/link";
import { useUserTier } from "@/hooks/use-user-tier";

export function UpgradeBanner() {
  const { isPremium, isMonthlyPremium, isAnnualPremium } = useUserTier();
  
  // Hide entirely for annual premium users
  if (isAnnualPremium) {
    return null;
  }
  
  // Show annual upgrade for monthly premium users
  if (isMonthlyPremium) {
    return (
      <Card className="border-green-500/20 bg-gradient-to-r from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-green-500/10 dark:bg-green-500/20 p-3">
                <Crown className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground font-sans">
                  Save with Annual Billing
                </h3>
                <p className="text-sm text-muted-foreground font-sans">
                  Switch to annual billing and save $18/year (2 months free).
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <span className="font-sans">Currently: $9/month</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-sans text-green-600 font-medium">Annual: $7.50/month</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600 font-sans">
                Save $18<span className="text-sm font-normal">/year</span>
              </div>
              <div className="text-sm text-muted-foreground font-sans">
                2 months free
              </div>
              <Link href="/pricing">
                <Button className="mt-3 font-sans bg-green-600 hover:bg-green-700">
                  Switch to Annual
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Show regular upgrade for free users
  if (!isPremium) {
  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-3">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground font-sans">
                Upgrade to Premium
              </h3>
              <p className="text-sm text-muted-foreground font-sans">
                Unlock unlimited subscriptions, advanced analytics, and more features.
              </p>
              <div className="grid grid-cols-2 md:flex md:flex-row md:items-center gap-3 md:space-x-4 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Crown className="h-3 w-3" />
                  <span className="font-sans">Unlimited subscriptions</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BarChart3 className="h-3 w-3" />
                  <span className="font-sans">Advanced analytics</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Download className="h-3 w-3" />
                  <span className="font-sans">Export data</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FolderKanban className="h-3 w-3" />
                  <span className="font-sans">Custom categories</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Bell className="h-3 w-3" />
                  <span className="font-sans">Smart alerts & notifications</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="h-3 w-3" />
                  <span className="font-sans">Priority support</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground font-sans">
              $9<span className="text-sm font-normal">/mo</span>
            </div>
            <div className="text-sm text-muted-foreground font-sans">
              or $7.50/mo annually
            </div>
            <Link href="/pricing">
              <Button className="mt-3 font-sans">
                Start 7-Day Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
    );
  }
  
  // Return null for any other case (shouldn't happen)
  return null;
}
