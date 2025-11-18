"use client";

/**
 * Savings Tab
 * Shows normalized savings from cancelled subscriptions.
 */

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { PiggyBank } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

type RangeKey = "all" | "30d" | "90d" | "365d";

function getSinceTimestamp(key: RangeKey): number | undefined {
  const now = Date.now();
  switch (key) {
    case "30d":
      return now - 30 * 24 * 60 * 60 * 1000;
    case "90d":
      return now - 90 * 24 * 60 * 60 * 1000;
    case "365d":
      return now - 365 * 24 * 60 * 60 * 1000;
    case "all":
    default:
      return undefined;
  }
}

export function SavingsTab() {
  const { user } = useUser();
  const [range, setRange] = useState<RangeKey>("90d");

  const since = getSinceTimestamp(range);

  const summary = useQuery(
    api.insights.getSavingsSummary,
    user?.id
      ? {
          clerkUserId: user.id,
          since,
        }
      : "skip"
  );

  if (!user?.id) {
    return null;
  }

  if (summary === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-32" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const { totals, items } = summary;
  const hasSavings = items.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold font-sans">Savings</h2>
          <p className="text-sm text-muted-foreground font-sans">
            Cancelled subscriptions converted to consistent monthly and yearly savings.
          </p>
        </div>
        <Select
          value={range}
          onValueChange={(value) => setRange(value as RangeKey)}
        >
          <SelectTrigger className="w-full sm:w-[220px] font-sans">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d" className="font-sans">
              Last 30 days
            </SelectItem>
            <SelectItem value="90d" className="font-sans">
              Last 90 days
            </SelectItem>
            <SelectItem value="365d" className="font-sans">
              Last 12 months
            </SelectItem>
            <SelectItem value="all" className="font-sans">
              All time
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-base font-sans">Total Savings</CardTitle>
            <CardDescription className="font-sans">
              Normalized to a single currency per subscription.
            </CardDescription>
          </div>
          <div className="rounded-full bg-primary/10 p-2">
            <PiggyBank className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-sans mb-1">
              Cancelled subscriptions
            </p>
            <p className="text-2xl font-bold font-sans">{totals.count}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-sans mb-1">
              Monthly saved (normalized)
            </p>
            <p className="text-2xl font-bold font-sans">
              {formatCurrency(totals.monthlySaved, "USD")}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-sans mb-1">
              Yearly saved (normalized)
            </p>
            <p className="text-2xl font-bold font-sans">
              {formatCurrency(totals.yearlySaved, "USD")}
            </p>
          </div>
        </CardContent>
      </Card>

      {!hasSavings ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="rounded-full bg-muted p-4">
              <PiggyBank className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold font-sans">No cancelled subscriptions yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md font-sans">
              When you cancel subscriptions from your dashboard, we&apos;ll track how much you&apos;re
              saving here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-sans">
              Cancelled subscriptions
            </CardTitle>
            <CardDescription className="font-sans">
              Normalized monthly and yearly savings per subscription.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <div
                key={item.subscriptionId}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border rounded-md px-3 py-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium font-sans">{item.name}</span>
                    <Badge variant="outline" className="font-sans text-xs capitalize">
                      {item.billingCycle}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-sans">
                    Cancelled{" "}
                    {format(item.cancelledAt, "MMM dd, yyyy")}
                  </p>
                </div>
                <div className="flex flex-col sm:items-end gap-1 text-sm font-sans">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      Monthly
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(item.monthlySavings, "USD")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      Yearly
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(item.yearlySavings, "USD")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

