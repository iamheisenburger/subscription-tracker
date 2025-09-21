"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign, TrendingUp, Calendar } from "lucide-react";

interface SubscriptionStatsProps {
  userId: string;
}

export function SubscriptionStats({ userId }: SubscriptionStatsProps) {
  const stats = useQuery(api.subscriptions.getSubscriptionStats, { 
    clerkId: userId 
  });

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Subscriptions",
      value: stats.totalSubscriptions.toString(),
      icon: CreditCard,
      description: `${stats.activeSubscriptions} active`,
    },
    {
      title: "Monthly Spending",
      value: `$${stats.monthlyTotal.toFixed(2)}`,
      icon: DollarSign,
      description: "Current month",
    },
    {
      title: "Yearly Total",
      value: `$${stats.yearlyTotal.toFixed(2)}`,
      icon: TrendingUp,
      description: "Projected annual",
    },
    {
      title: "Next Renewal",
      value: stats.nextRenewal ? new Date(stats.nextRenewal).toLocaleDateString() : "None",
      icon: Calendar,
      description: "Upcoming payment",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}