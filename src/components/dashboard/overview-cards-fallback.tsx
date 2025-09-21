"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, Target } from "lucide-react";

interface OverviewCardsProps {
  userId: string;
}

export function OverviewCardsFallback({ }: OverviewCardsProps) {
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
      <div className="col-span-full">
        <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
          <CardContent className="p-4">
            <p className="text-sm text-foreground font-sans">
              <strong>Environment Setup Required:</strong> Please create a .env.local file with your Clerk and Convex credentials to enable real-time data.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
