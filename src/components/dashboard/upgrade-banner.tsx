"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, BarChart3, Download, Bell, FolderKanban, Shield } from "lucide-react";
import Link from "next/link";

export function UpgradeBanner() {
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
            <div className="flex items-center gap-2 justify-end mt-3">
              <Link href="/pricing">
                <Button className="font-sans">
                  Start 7-Day Free Trial
                </Button>
              </Link>
              <Button
                variant="outline"
                className="font-sans"
                onClick={async () => {
                  try {
                    await fetch('/api/sync/tier', { method: 'POST' });
                    window.location.reload();
                  } catch {}
                }}
              >
                Refresh Status
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
