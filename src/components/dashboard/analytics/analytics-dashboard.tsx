"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { SpendingTrendsChart } from "./spending-trends-chart";
import { CategoryBreakdownChart } from "./category-breakdown-chart";
import { BillingCycleChart } from "./billing-cycle-chart";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface AnalyticsDashboardProps {
  userId: string;
}

export function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const preferred = localStorage.getItem('preferred-currency') || 'USD';
      setCurrency(preferred);
    }
  }, []);

  const analytics = useQuery(api.subscriptions.getSubscriptionAnalytics, {
    clerkId: userId,
    targetCurrency: currency,
  });

  if (analytics === undefined) {
    return <AnalyticsSkeleton />;
  }

  if (!analytics || analytics.totalSubscriptions === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold mb-2">No Data Available</h3>
        <p className="text-muted-foreground mb-6">
          Add some subscriptions to see your analytics.
        </p>
        <a 
          href="/dashboard" 
          className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
        >
          Add Your First Subscription
        </a>
      </div>
    );
  }

  const {
    totalSubscriptions,
    spendingTrends,
    categoryBreakdown,
    cycleBreakdown,
    upcomingRenewals,
    averagePerSubscription,
    currency: responseCurrency,
  } = analytics;

  const displayCurrency = responseCurrency || currency;

  return (
    <div className="space-y-6">
      {/* Quick Stats - Mobile app style */}
      <div className="bg-card rounded-2xl p-5 border border-border">
        <div className="flex items-center">
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold">{totalSubscriptions}</p>
            <p className="text-xs text-muted-foreground font-medium">Subscriptions</p>
          </div>
          <div className="w-px h-10 bg-border mx-4" />
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold">{formatCurrency(averagePerSubscription, displayCurrency)}</p>
            <p className="text-xs text-muted-foreground font-medium">Avg Monthly</p>
          </div>
        </div>
      </div>

      {/* Upcoming Renewals */}
      {upcomingRenewals > 0 && (
        <div className="bg-card rounded-2xl border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-bold">Next 3 Months</h2>
          </div>
          <div className="p-4">
            <RenewalsList userId={userId} currency={displayCurrency} />
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-card rounded-2xl border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-bold">Monthly Breakdown</h2>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {categoryBreakdown.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(item.category) }}
                    />
                    <span className="font-semibold text-[15px]">{item.category}</span>
                  </div>
                  <span className="font-bold text-[15px]">
                    {formatCurrency(item.amount, displayCurrency)}/mo
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <SpendingTrendsChart data={spendingTrends} currency={displayCurrency} />
        </div>
        <CategoryBreakdownChart data={categoryBreakdown} currency={displayCurrency} />
        <BillingCycleChart data={cycleBreakdown} currency={displayCurrency} />
      </div>

      {/* Recommendations */}
      <div className="bg-card rounded-2xl border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold">Recommendations</h2>
        </div>
        <div className="p-4 space-y-3">
          {categoryBreakdown.length > 0 && (
            <div className="bg-muted/50 rounded-xl p-4 border-l-4 border-primary">
              <h4 className="font-bold text-[15px] mb-1">Top Spending Category</h4>
              <p className="text-sm text-muted-foreground">
                {categoryBreakdown[0].category} accounts for {formatCurrency(categoryBreakdown[0].amount, displayCurrency)} monthly. Consider reviewing these subscriptions.
              </p>
            </div>
          )}
          {averagePerSubscription > 15 && (
            <div className="bg-muted/50 rounded-xl p-4 border-l-4 border-warning">
              <h4 className="font-bold text-[15px] mb-1">High Average Cost</h4>
              <p className="text-sm text-muted-foreground">
                Your average subscription cost is {formatCurrency(averagePerSubscription, displayCurrency)}. Look for bundle deals or family plans to save.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RenewalsList({ userId, currency }: { userId: string; currency: string }) {
  const subscriptions = useQuery(api.subscriptions.getUserSubscriptions, { clerkId: userId });
  
  if (!subscriptions) return null;

  const now = new Date();
  const renewals = subscriptions
    .filter(sub => sub.isActive)
    .map(sub => ({
      ...sub,
      daysUntil: Math.ceil((sub.nextBillingDate - now.getTime()) / (1000 * 60 * 60 * 24))
    }))
    .filter(sub => sub.daysUntil >= 0 && sub.daysUntil <= 90)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  return (
    <div className="space-y-3">
      {renewals.map((renewal) => (
        <div 
          key={renewal._id}
          className="flex items-center justify-between py-3 border-b border-border last:border-0"
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: getCategoryColor(renewal.category || 'other') }}
            />
            <div>
              <p className="font-semibold text-[15px]">{renewal.name}</p>
              <p className="text-sm font-bold">{formatCurrency(renewal.cost, currency)}</p>
            </div>
          </div>
          <span className={cn(
            "text-sm font-semibold",
            renewal.daysUntil <= 3 ? "text-destructive" : "text-muted-foreground"
          )}>
            {renewal.daysUntil === 0 ? "Today" : 
             renewal.daysUntil === 1 ? "1 day" : 
             `${renewal.daysUntil} days`}
          </span>
        </div>
      ))}
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  streaming: '#E63946',
  music: '#F77F00',
  productivity: '#06A77D',
  fitness: '#2A9D8F',
  gaming: '#7209B7',
  news: '#457B9D',
  cloud: '#3A86FF',
  other: '#6C757D',
  entertainment: '#E63946',
  utilities: '#06A77D',
  software: '#3A86FF',
  education: '#457B9D',
  finance: '#10B981',
  health: '#2A9D8F',
  food: '#F77F00',
  shopping: '#7209B7',
  travel: '#3A86FF',
  social: '#E63946',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] || CATEGORY_COLORS.other;
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl p-5 border border-border">
        <div className="flex items-center">
          <div className="flex-1 text-center">
            <Skeleton className="h-8 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
          <div className="w-px h-10 bg-border mx-4" />
          <div className="flex-1 text-center">
            <Skeleton className="h-8 w-16 mx-auto mb-1" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
        </div>
      </div>
      
      <div className="bg-card rounded-2xl border border-border">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
