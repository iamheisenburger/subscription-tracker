"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-7 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Subscriptions",
      value: analytics?.totalSubscriptions || stats?.totalSubscriptions || 0,
      description: `${stats?.activeSubscriptions || 0} active`,
      icon: Target,
    },
    {
      title: "Monthly Spend",
      value: analytics?.monthlyTotal 
        ? formatCurrency(analytics.monthlyTotal, analytics.currency || preferredCurrency)
        : formatCurrency(0, preferredCurrency),
      description: `Current monthly cost (${analytics?.currency || preferredCurrency})`,
      icon: DollarSign,
    },
    {
      title: "Yearly Spend",
      value: analytics?.yearlyTotal
        ? formatCurrency(analytics.yearlyTotal, analytics.currency || preferredCurrency)
        : formatCurrency(0, preferredCurrency),
      description: `Projected annual cost (${analytics?.currency || preferredCurrency})`,
      icon: TrendingUp,
    },
    {
      title: "Next Renewal",
      value: stats?.nextRenewal ? format(stats.nextRenewal, "MMM dd") : "N/A",
      description: "Upcoming billing date",
      icon: Calendar,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="border border-border/50 shadow-sm bg-card rounded-2xl hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
            <CardTitle className="text-sm font-bold font-sans uppercase tracking-widest text-muted-foreground/80">{card.title}</CardTitle>
            <div className="p-2.5 bg-primary/5 rounded-xl border border-primary/10">
              <card.icon className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-3xl font-black font-sans tracking-tighter">{card.value}</div>
            <p className="text-xs text-muted-foreground font-semibold font-sans mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
