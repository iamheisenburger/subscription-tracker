"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, BarChart3, Download, Bell, FolderKanban, Shield } from "lucide-react";
import Link from "next/link";
import { useUserTier } from "@/hooks/use-user-tier";
import { TierSyncButton } from "./tier-sync-button";

export function UpgradeBanner() {
  const { isLoading, isMonthlyPremium, isAnnualPremium } = useUserTier();
  
  // Don't show anything while loading to prevent flash
  if (isLoading) {
    return null;
  }
  
  // Hide banner for ALL premium users (they have small sidebar CTA instead)
  // Much better UX - no intrusive banners for paying customers!
  if (isMonthlyPremium || isAnnualPremium) {
    return null;
  }
  
  // Show regular upgrade banner for free users only
  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          <div className="text-center sm:text-right">
            <div className="text-2xl font-bold text-foreground font-sans">
              $9<span className="text-sm font-normal">/mo</span>
            </div>
            <div className="text-sm text-muted-foreground font-sans">
              or $7.50/mo annually
            </div>
            <Link href="/pricing">
              <Button className="mt-3 w-full sm:w-auto font-sans">
                Start 7-Day Free Trial
              </Button>
            </Link>
            
            {/* Sync Button for Users Who Already Upgraded */}
            <div className="mt-3 pt-3 border-t border-border/20">
              <p className="text-xs text-muted-foreground font-sans mb-2 text-center sm:text-right">
                Already upgraded? 
              </p>
              <TierSyncButton variant="ghost" size="sm" className="text-xs w-full sm:w-auto" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}