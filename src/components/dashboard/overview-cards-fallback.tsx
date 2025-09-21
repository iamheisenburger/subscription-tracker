"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, Target } from "lucide-react";

interface OverviewCardsProps {
  userId: string;
}

export function OverviewCardsFallback({ userId }: OverviewCardsProps) {
  const cards = [
    {
      title: "Total Subscriptions",
      value: "0",
      description: "0 active",
      icon: Target,
    },
    {
      title: "Monthly Spend",
      value: "$0.00",
      description: "Current monthly cost",
      icon: DollarSign,
    },
    {
      title: "Yearly Spend",
      value: "$0.00",
      description: "Projected annual cost",
      icon: TrendingUp,
    },
    {
      title: "Next Renewal",
      value: "N/A",
      description: "Upcoming billing date",
      icon: Calendar,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-sans">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-sans">{card.value}</div>
            <p className="text-xs text-muted-foreground font-sans">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
      <div className="col-span-full">
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="p-4">
            <p className="text-sm text-orange-700 dark:text-orange-300 font-sans">
              <strong>Environment Setup Required:</strong> Please create a .env.local file with your Clerk and Convex credentials to enable real-time data.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
