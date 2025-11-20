"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, BarChart3, Download, Bell, FolderKanban, Shield } from "lucide-react";
import Link from "next/link";
import { useUserTier } from "@/hooks/use-user-tier";

export function UpgradeBanner() {
  const { isLoading, isPlus, isAutomate, isFree } = useUserTier();

  // Don't show anything while loading to prevent flash
  if (isLoading) {
    return null;
  }

  // Hide banner for Automate users (they're on highest tier)
  // BankConnectionCTACard handles their onboarding
  if (isAutomate) {
    return null;
  }

  // For Plus users: Show upgrade to Automate banner
  if (isPlus) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground font-sans">
                  Upgrade to Automate
                </h3>
                <p className="text-sm text-muted-foreground font-sans">
                  Connect your bank and let AI automatically detect subscriptions for you.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Shield className="h-3 w-3" />
                    <span className="font-sans">Bank sync</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BarChart3 className="h-3 w-3" />
                    <span className="font-sans">Auto-detection</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Bell className="h-3 w-3" />
                    <span className="font-sans">Price alerts</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-2xl font-bold text-foreground font-sans">
                $9<span className="text-sm font-normal">/mo</span>
              </div>
              <div className="text-sm text-muted-foreground font-sans">
                or $6.50/mo annually
              </div>
              <Link href="/dashboard/upgrade">
                <Button className="mt-3 w-full sm:w-auto font-sans">
                  Upgrade to Automate
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For Free users: Show upgrade to Plus or Automate banner
  if (isFree) {
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
                  Upgrade to Plus or Automate
                </h3>
                <p className="text-sm text-muted-foreground font-sans">
                  Unlock unlimited subscriptions, advanced analytics, and automated features.
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
                From $5<span className="text-sm font-normal">/mo</span>
              </div>
              <div className="text-sm text-muted-foreground font-sans">
                Plus $3.50/mo or Automate $6.50/mo annually
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