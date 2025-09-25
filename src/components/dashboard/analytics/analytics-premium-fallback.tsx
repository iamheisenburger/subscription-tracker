"use client";

import { Crown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TierSyncButton } from "../tier-sync-button";

export function AnalyticsPremiumFallback() {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <TrendingUp className="w-10 h-10 text-primary" />
      </div>
      
      <h2 className="text-3xl font-bold mb-4 font-sans">Premium Feature</h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto font-sans">
        Advanced analytics and spending trends are available with Premium. Get detailed insights into your subscription spending patterns.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <Link href="/pricing">
          <Button className="w-full sm:w-auto font-sans">
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Premium
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline" className="w-full sm:w-auto font-sans">
            Back to Overview
          </Button>
        </Link>
      </div>

      {/* Sync Button for Users Who Already Upgraded */}
      <div className="mt-8 pt-6 border-t border-border/50 max-w-md mx-auto">
        <p className="text-xs text-muted-foreground font-sans mb-4">
          Already upgraded but still seeing this? Your subscription status might need syncing.
        </p>
        <TierSyncButton variant="ghost" className="text-xs" />
      </div>
    </div>
  );
}
