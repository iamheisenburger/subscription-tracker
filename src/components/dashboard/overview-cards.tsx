"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Calendar, Target } from "lucide-react";
import { format } from "date-fns";
import { ConvexErrorBoundary } from "@/components/convex-error-boundary";
import { useState, useEffect } from "react";
import { convertMultipleCurrencies, getPreferredCurrency, formatCurrency } from "@/lib/currency";

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
  const [convertedTotals, setConvertedTotals] = useState<{
    monthlyTotal: number;
    yearlyTotal: number;
    currency: string;
  } | null>(null);

  // Convert currencies when stats are available
  useEffect(() => {
    if (!stats?.subscriptionCosts) return;

    const convertCurrencies = async () => {
      try {
        const preferredCurrency = getPreferredCurrency();
        
        // Convert all subscription costs to monthly equivalents in preferred currency
        const monthlyAmounts = stats.subscriptionCosts.map(sub => {
          let monthlyAmount = sub.amount;
          if (sub.billingCycle === "yearly") {
            monthlyAmount = sub.amount / 12;
          } else if (sub.billingCycle === "weekly") {
            monthlyAmount = sub.amount * 4.33; // Average weeks per month
          }
          
          return {
            amount: monthlyAmount,
            currency: sub.currency
          };
        });

        const conversions = await convertMultipleCurrencies(monthlyAmounts, preferredCurrency);
        const monthlyTotal = conversions.reduce((sum, conv) => sum + conv.convertedAmount, 0);
        const yearlyTotal = monthlyTotal * 12;

        setConvertedTotals({
          monthlyTotal: Math.round(monthlyTotal * 100) / 100,
          yearlyTotal: Math.round(yearlyTotal * 100) / 100,
          currency: preferredCurrency
        });
      } catch (error) {
        console.error('Currency conversion failed:', error);
        // Fallback to simple sum without conversion
        const monthlyTotal = stats.subscriptionCosts.reduce((sum, sub) => {
          let monthlyAmount = sub.amount;
          if (sub.billingCycle === "yearly") monthlyAmount = sub.amount / 12;
          else if (sub.billingCycle === "weekly") monthlyAmount = sub.amount * 4.33;
          return sum + monthlyAmount;
        }, 0);
        
        setConvertedTotals({
          monthlyTotal: Math.round(monthlyTotal * 100) / 100,
          yearlyTotal: Math.round(monthlyTotal * 12 * 100) / 100,
          currency: 'USD' // Default fallback
        });
      }
    };

    convertCurrencies();
  }, [stats?.subscriptionCosts]);

  if (stats === undefined) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Subscriptions",
      value: stats?.totalSubscriptions || 0,
      description: `${stats?.activeSubscriptions || 0} active`,
      icon: Target,
    },
    {
      title: "Monthly Spend",
      value: convertedTotals 
        ? formatCurrency(convertedTotals.monthlyTotal, convertedTotals.currency)
        : "Loading...",
      description: convertedTotals?.currency 
        ? `Current monthly cost (${convertedTotals.currency})`
        : "Current monthly cost",
      icon: DollarSign,
    },
    {
      title: "Yearly Spend",
      value: convertedTotals 
        ? formatCurrency(convertedTotals.yearlyTotal, convertedTotals.currency)
        : "Loading...",
      description: convertedTotals?.currency 
        ? `Projected annual cost (${convertedTotals.currency})`
        : "Projected annual cost",
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
        <Card key={card.title} className="border-0 shadow-sm bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium font-sans text-muted-foreground">{card.title}</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <card.icon className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold font-sans tracking-tight">{card.value}</div>
            <p className="text-xs text-muted-foreground font-sans mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
