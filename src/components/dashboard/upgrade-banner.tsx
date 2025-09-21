"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, BarChart3, Download } from "lucide-react";
import Link from "next/link";

export function UpgradeBanner() {
  return (
    <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-3">
              <Crown className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 font-sans">
                Upgrade to Premium
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 font-sans">
                Unlock unlimited subscriptions, advanced analytics, and more features.
              </p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-yellow-600 dark:text-yellow-400">
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
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 font-sans">
              $9<span className="text-sm font-normal">/mo</span>
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 font-sans">
              or $7.50/mo annually
            </div>
            <Link href="/pricing">
              <Button className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white font-sans">
                Start 7-Day Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
