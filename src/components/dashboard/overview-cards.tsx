"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Calendar, Target } from "lucide-react";
import { format } from "date-fns";
import { ConvexErrorBoundary } from "@/components/convex-error-boundary";
import { useState, useEffect } from "react";
import { getPreferredCurrency, formatCurrency } from "@/lib/currency";

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
  
  // GET PREFERRED CURRENCY
  const [preferredCurrency, setPreferredCurrency] = useState('USD');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const preferred = getPreferredCurrency();
      setPreferredCurrency(preferred);
    }
  }, []);

  // USE SAME ANALYTICS BACKEND AS ANALYTICS PAGE - SINGLE SOURCE OF TRUTH
  const analytics = useQuery(api.subscriptions.getSubscriptionAnalytics, {
    clerkId: userId,
    targetCurrency: preferredCurrency,
  });

  if (stats === undefined) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="rounded-2xl border border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-20 rounded-lg" />
                  <Skeleton className="h-6 w-24 rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total",
      value: analytics?.totalSubscriptions || stats?.totalSubscriptions || 0,
      description: `${stats?.activeSubscriptions || 0} active`,
      icon: Target,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Monthly",
      value: analytics?.monthlyTotal 
        ? formatCurrency(analytics.monthlyTotal, analytics.currency || preferredCurrency)
        : formatCurrency(0, preferredCurrency),
      description: analytics?.currency || preferredCurrency,
      icon: DollarSign,
      color: "bg-success/10 text-success",
    },
    {
      title: "Yearly",
      value: analytics?.yearlyTotal
        ? formatCurrency(analytics.yearlyTotal, analytics.currency || preferredCurrency)
        : formatCurrency(0, preferredCurrency),
      description: "Projected",
      icon: TrendingUp,
      color: "bg-warning/10 text-warning",
    },
    {
      title: "Next",
      value: stats?.nextRenewal ? format(stats.nextRenewal, "MMM dd") : "N/A",
      description: "Renewal",
      icon: Calendar,
      color: "bg-primary/10 text-primary",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="rounded-2xl border border-border hover:shadow-md transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.title}</p>
                <p className="text-xl font-bold tracking-tight">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
