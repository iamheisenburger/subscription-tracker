"use client";

/**
 * Price History Chart Component
 * Displays price changes over time for selected subscription with interactive chart
 */

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Id } from "../../../../convex/_generated/dataModel";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface PriceHistoryChartProps {
  subscriptionId?: string | null;
}

export function PriceHistoryChart({ subscriptionId }: PriceHistoryChartProps) {
  const { user } = useUser();
  const [selectedSubId, setSelectedSubId] = useState<Id<"subscriptions"> | undefined>(
    subscriptionId as Id<"subscriptions"> | undefined
  );

  // Get user's subscriptions for dropdown
  const subscriptions = useQuery(
    api.subscriptions.getUserSubscriptions,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Get price history for selected subscription
  const priceData = useQuery(
    api.insights.getSubscriptionPriceHistory,
    user?.id && selectedSubId ? { clerkUserId: user.id, subscriptionId: selectedSubId } : "skip"
  );

  if (subscriptions === undefined || (selectedSubId && priceData === undefined)) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center space-y-2">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="font-semibold text-lg font-sans">No subscriptions yet</h3>
            <p className="text-sm text-muted-foreground font-sans">
              Add a subscription to track price changes over time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Auto-select first subscription if none selected
  if (!selectedSubId && subscriptions.length > 0) {
    setSelectedSubId(subscriptions[0]._id as Id<"subscriptions">);
    return <Skeleton className="h-[500px] w-full" />;
  }

  const selectedSubscription = subscriptions.find((s) => s._id === selectedSubId);

  if (!priceData) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  // Transform data for chart - add initial price point and changes
  const chartData: Array<{ date: string; price: number; fullDate: string; label: string }> = [];

  // Add starting price point
  if (priceData.history.length > 0) {
    const firstChange = priceData.history[0];
    chartData.push({
      date: format(priceData.subscription.createdAt, "MMM yyyy"),
      price: firstChange.oldPrice,
      fullDate: format(priceData.subscription.createdAt, "MMM dd, yyyy"),
      label: "Initial",
    });
  }

  // Add all price changes
  priceData.history.forEach((h) => {
    chartData.push({
      date: format(h.detectedAt, "MMM yyyy"),
      price: h.newPrice,
      fullDate: format(h.detectedAt, "MMM dd, yyyy"),
      label: "Price Change",
    });
  });

  // Add current price if no history
  if (priceData.history.length === 0) {
    chartData.push({
      date: format(priceData.subscription.createdAt, "MMM yyyy"),
      price: priceData.subscription.cost,
      fullDate: format(priceData.subscription.createdAt, "MMM dd, yyyy"),
      label: "Current",
    });
  }

  const hasHistory = priceData.history.length > 0;
  const stats = priceData.stats;
  const changeColor = stats.totalChange > 0 ? "text-red-600" : stats.totalChange < 0 ? "text-green-600" : "text-muted-foreground";
  const TrendIcon = stats.totalChange > 0 ? TrendingUp : TrendingDown;

  return (
    <div className="space-y-6">
      {/* Subscription Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="font-sans">Price History</CardTitle>
              <CardDescription className="font-sans">
                Track how subscription prices have changed over time
              </CardDescription>
            </div>
            <Select
              value={selectedSubId || undefined}
              onValueChange={(value) => setSelectedSubId(value as Id<"subscriptions">)}
            >
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Select subscription" />
              </SelectTrigger>
              <SelectContent>
                {subscriptions.map((sub) => (
                  <SelectItem key={sub._id} value={sub._id} className="font-sans">
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!hasHistory ? (
            <div className="py-16 text-center space-y-3">
              <div className="rounded-full bg-muted p-6 w-fit mx-auto">
                <Activity className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-lg font-sans mb-1">No price changes yet</h3>
                <p className="text-sm text-muted-foreground font-sans max-w-md mx-auto">
                  We&apos;ll automatically detect and track price changes for this subscription.
                  You&apos;ll see the history here once we detect changes.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chart */}
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      className="text-xs font-sans"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      className="text-xs font-sans"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        formatCurrency(value, selectedSubscription?.currency || "USD"),
                        "Price"
                      ]}
                      labelFormatter={(label, payload) =>
                        payload && payload[0] ? payload[0].payload.fullDate : label
                      }
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-8">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground font-sans mb-1">Current Price</p>
                    <p className="text-2xl font-bold font-sans">
                      {formatCurrency(stats.currentPrice, selectedSubscription?.currency || "USD")}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground font-sans mb-1">Starting Price</p>
                    <p className="text-2xl font-bold font-sans">
                      {formatCurrency(stats.startPrice, selectedSubscription?.currency || "USD")}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground font-sans mb-1">Total Change</p>
                    <p className={`text-2xl font-bold font-sans flex items-center gap-1 ${changeColor}`}>
                      {stats.totalChange !== 0 && <TrendIcon className="h-5 w-5" />}
                      {stats.totalChange > 0 ? "+" : ""}
                      {stats.totalChange.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground font-sans mb-1">Price Changes</p>
                    <p className="text-2xl font-bold font-sans">{stats.changeCount}</p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
