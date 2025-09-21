"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Calendar, Target } from "lucide-react";
import { format } from "date-fns";

interface OverviewCardsProps {
  userId: string;
}

export function OverviewCards({ userId }: OverviewCardsProps) {
  const stats = useQuery(api.subscriptions.getSubscriptionStats, { clerkId: userId });

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
      value: `$${stats?.monthlyTotal?.toFixed(2) || "0.00"}`,
      description: "Current monthly cost",
      icon: DollarSign,
    },
    {
      title: "Yearly Spend",
      value: `$${stats?.yearlyTotal?.toFixed(2) || "0.00"}`,
      description: "Projected annual cost",
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
