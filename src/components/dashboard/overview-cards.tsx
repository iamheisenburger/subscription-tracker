"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Crown, TrendingUp } from "lucide-react";
import { ConvexErrorBoundary } from "@/components/convex-error-boundary";
import { useState, useEffect } from "react";
import { getPreferredCurrency, formatCurrency } from "@/lib/currency";
import { useUserTier } from "@/hooks/use-user-tier";
import Link from "next/link";

interface OverviewCardsProps {
  userId: string;
}

export function OverviewCards({ userId }: OverviewCardsProps) {
  return (
    <ConvexErrorBoundary>
      <OverviewCardsContent userId={userId} />
    </ConvexErrorBoundary>
  );
}

function OverviewCardsContent({ userId }: OverviewCardsProps) {
  const stats = useQuery(api.subscriptions.getSubscriptionStats, { clerkId: userId });
  const { isPremium } = useUserTier();

  // Get preferred currency - GLOBAL
  const [preferredCurrency, setPreferredCurrency] = useState('USD');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const preferred = getPreferredCurrency();
      setPreferredCurrency(preferred);
    }
  }, []);

  // Use same analytics backend as analytics page - CONSISTENT WITH ALL PAGES
  const analytics = useQuery(api.subscriptions.getSubscriptionAnalytics, {
    clerkId: userId,
    targetCurrency: preferredCurrency,
  });

  // Get notification preferences for budget
  const notificationPrefs = useQuery(api.notifications.getNotificationPreferences, { clerkId: userId });

  if (stats === undefined) {
    return (
      <div className="space-y-4">
        {/* Loading skeleton - proper dark mode */}
        <Card className="rounded-2xl bg-[#1F2937] dark:bg-[#1A1F26] border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <Skeleton className="h-20 w-32 bg-white/10 dark:bg-white/5" />
              <Skeleton className="h-20 w-32 bg-white/10 dark:bg-white/5" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const monthlyTotal = analytics?.monthlyTotal || 0;
  const yearlyTotal = analytics?.yearlyTotal || 0;
  const currency = analytics?.currency || preferredCurrency;
  const budget = notificationPrefs?.spendingThreshold || null;

  // Calculate budget usage
  const budgetUsagePercent = budget ? Math.min((monthlyTotal / budget) * 100, 100) : 0;
  const isOverBudget = budget ? monthlyTotal > budget : false;

  return (
    <div className="space-y-4">
      {/* Main Summary Card - Mobile App Style with proper dark mode */}
      <Card className="rounded-2xl bg-[#1F2937] dark:bg-[#1A1F26] border-0 shadow-lg overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            {/* Monthly Total */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-white/60 dark:text-white/50 uppercase tracking-wide font-sans">Monthly</p>
              <p className="text-3xl font-bold text-white dark:text-[#F3F4F6] tracking-tight font-sans">
                {formatCurrency(monthlyTotal, currency)}
              </p>
              <p className="text-xs text-white/40 dark:text-white/30 font-sans">{analytics?.totalSubscriptions || 0} subscriptions</p>
            </div>

            {/* Yearly Total */}
            <div className="space-y-1 text-right">
              <p className="text-sm font-medium text-white/60 dark:text-white/50 uppercase tracking-wide font-sans">Yearly</p>
              <p className="text-3xl font-bold text-white dark:text-[#F3F4F6] tracking-tight font-sans">
                {formatCurrency(yearlyTotal, currency)}
              </p>
              <div className="flex items-center justify-end gap-1 text-xs text-white/40 dark:text-white/30 font-sans">
                <TrendingUp className="h-3 w-3" />
                <span>projected</span>
              </div>
            </div>
          </div>

          {/* Budget Progress Bar - Only for Plus users with budget set */}
          {isPremium && budget ? (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-white/60 dark:text-white/50 font-sans">Budget</span>
                <span className={`text-xs font-semibold font-sans ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formatCurrency(monthlyTotal, currency)} / {formatCurrency(budget, currency)}
                </span>
              </div>
              <Progress
                value={budgetUsagePercent}
                className="h-2 bg-white/10 dark:bg-white/5"
                // Custom colors via CSS
                style={{
                  // @ts-expect-error CSS custom property
                  '--progress-foreground': isOverBudget ? '#EF4444' : '#10B981',
                }}
              />
              {isOverBudget && (
                <p className="text-xs text-red-400 font-medium font-sans">
                  Over budget by {formatCurrency(monthlyTotal - budget, currency)}
                </p>
              )}
            </div>
          ) : isPremium ? (
            // Plus user without budget set
            <Link href="/dashboard/budget" className="block mt-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 dark:bg-white/[0.03] hover:bg-white/10 dark:hover:bg-white/[0.05] transition-colors">
                <span className="text-sm text-white/70 dark:text-white/60 font-sans">Set a monthly budget</span>
                <span className="text-xs text-white/40 dark:text-white/30 font-sans">Tap to configure</span>
              </div>
            </Link>
          ) : (
            // Free user - show upgrade prompt
            <Link href="/dashboard/upgrade" className="block mt-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 transition-colors border border-amber-500/20">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-400" />
                  <span className="text-sm text-amber-200 dark:text-amber-300 font-medium font-sans">Unlock budget tracking</span>
                </div>
                <span className="text-xs text-amber-400/70 dark:text-amber-400/60 font-sans">Upgrade to Plus</span>
              </div>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
