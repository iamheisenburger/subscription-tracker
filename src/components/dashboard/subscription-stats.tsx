"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, CreditCard, TrendingUp, AlertTriangle } from "lucide-react";

interface SubscriptionStatsProps {
  userId: string;
}

export function SubscriptionStats({ }: SubscriptionStatsProps) {
  const { user } = useUser();
  const analytics = useQuery(
    api.subscriptions.getSubscriptionAnalytics,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const statItems = [
    {
      title: "Total Subscriptions",
      value: analytics?.totalSubscriptions?.toString() ?? "0",
      icon: CreditCard,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Monthly Spending",
      value: `$${(analytics?.monthlyTotal ?? 0).toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Yearly Total",
      value: `$${(analytics?.yearlyTotal ?? 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Upcoming Renewals",
      value: analytics?.upcomingRenewals?.toString() ?? "0",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  if (analytics === undefined) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {item.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {item.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
