"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, BarChart3, Download, Bell, FolderKanban, Shield } from "lucide-react";
import Link from "next/link";
import { useUserTier } from "@/hooks/use-user-tier";

export function UpgradeBanner() {
  const { isLoading, isPlus, isAutomate, isFree, subscriptionType } = useUserTier();

  // Don't show anything while loading to prevent flash
  if (isLoading) {
    return null;
  }

  // Hide banner for Automate users (they're on highest tier)
  // BankConnectionCTACard handles their onboarding
  if (isAutomate) {
    return null;
  }

  // For Plus users:
  // - Monthly: show CTA to switch to annual Plus
  // - Annual: no banner (already on best deal)
  if (isPlus) {
    const isAnnual = subscriptionType === "annual";

    if (isAnnual) {
      return null;
    }

    return (
      <Card className="border-primary/15 bg-card shadow-sm">
        <CardContent className="p-4 space-y-4 sm:space-y-0 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-2.5 sm:p-3">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-semibold text-foreground font-sans">
                  Switch to annual Plus and save
                </h3>
                <p className="text-sm text-muted-foreground font-sans">
                  Lock in a lower effective monthly price with the annual Plus plan.
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <div className="text-xl sm:text-2xl font-bold text-foreground font-sans">
                $3.50<span className="text-sm font-normal">/mo</span>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground font-sans">
                Billed annually at $42.00/year
              </div>
              <Link href="/dashboard/upgrade">
                <Button className="mt-3 w-full sm:w-auto font-sans">
                  Switch to annual Plus
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For Free users: Show upgrade to Plus banner
  if (isFree) {
    return (
      <Card className="border-primary/15 bg-card shadow-sm">
        <CardContent className="p-4 space-y-4 sm:space-y-0 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-2.5 sm:p-3">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-semibold text-foreground font-sans">
                  Upgrade to Plus
                </h3>
                <p className="text-sm text-muted-foreground font-sans">
                  Unlock unlimited subscriptions, advanced analytics, and automated features.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
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
            <div className="text-left sm:text-right w-full sm:w-auto">
              <div className="text-xl sm:text-2xl font-bold text-foreground font-sans">
                From $5<span className="text-sm font-normal">/mo</span>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground font-sans">
                Plus $3.50/mo when billed annually
              </div>
              <Link href="/dashboard/upgrade">
                <Button className="mt-3 w-full sm:w-auto font-sans">
                  Start 7-Day Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback: return null
  return null;
}