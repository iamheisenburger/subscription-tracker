"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { SpendingTrendsChart } from "./spending-trends-chart";
import { CategoryBreakdownChart } from "./category-breakdown-chart";
import { BillingCycleChart } from "./billing-cycle-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, Target, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/currency";

interface AnalyticsDashboardProps {
  userId: string;
}

export function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [currency, setCurrency] = useState("USD");

  // Get user's preferred currency from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const preferred = localStorage.getItem('preferred-currency') || 'USD';
      setCurrency(preferred);
    }
  }, []);

  // TEMP: Remove targetCurrency until deployed to correct Convex project
  const analytics = useQuery(api.subscriptions.getSubscriptionAnalytics, {
    clerkId: userId,
  });

  if (analytics === undefined) {
    return <AnalyticsSkeleton />;
  }

  if (!analytics || analytics.totalSubscriptions === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <TrendingUp className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2 font-sans">No Data Available</h3>
        <p className="text-muted-foreground mb-6 font-sans">
          Add some subscriptions to see your analytics and spending insights.
        </p>
        <a 
          href="/dashboard" 
          className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-sans hover:bg-primary/90"
        >
          Add Your First Subscription
        </a>
      </div>
    );
  }

  const {
    totalSubscriptions,
    monthlyTotal,
    yearlyTotal,
    spendingTrends,
    categoryBreakdown,
    cycleBreakdown,
    upcomingRenewals,
    averagePerSubscription,
    currency: responseCurrency, // Currency from backend response
  } = analytics;

  // Use backend's converted currency or user preference
  const displayCurrency = responseCurrency || currency;

  return (
    <div className="space-y-8">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-sans">Total Subscriptions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-sans">{totalSubscriptions}</div>
            <p className="text-xs text-muted-foreground font-sans">
              Active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-sans">Monthly Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-sans">{formatCurrency(monthlyTotal, displayCurrency)}</div>
            <p className="text-xs text-muted-foreground font-sans">
              Per month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-sans">Yearly Projection</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-sans">{formatCurrency(yearlyTotal, displayCurrency)}</div>
            <p className="text-xs text-muted-foreground font-sans">
              Annual total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-sans">Upcoming Renewals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-sans">{upcomingRenewals}</div>
            <p className="text-xs text-muted-foreground font-sans">
              Next 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <SpendingTrendsChart data={spendingTrends} currency={displayCurrency} />
        </div>
        
        <CategoryBreakdownChart data={categoryBreakdown} currency={displayCurrency} />
        
        <BillingCycleChart data={cycleBreakdown} currency={displayCurrency} />
      </div>

      {/* Insights Card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Spending Insights</CardTitle>
          <CardDescription className="font-sans">
            Key insights about your subscription spending
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-sans">Average</Badge>
              </div>
              <p className="text-sm text-muted-foreground font-sans">
                You spend <span className="font-semibold text-foreground">{formatCurrency(averagePerSubscription, displayCurrency)}</span> per subscription on average
              </p>
            </div>

            {categoryBreakdown.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-sans">Top Category</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-sans">
                  <span className="font-semibold text-foreground">{categoryBreakdown[0].category}</span> accounts for {formatCurrency(categoryBreakdown[0].amount, displayCurrency)} monthly
                </p>
              </div>
            )}

            {cycleBreakdown.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-sans">Billing</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-sans">
                  Most subscriptions are billed <span className="font-semibold text-foreground">{cycleBrekdown[0].cycle.toLowerCase()}</span>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Key Metrics Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}