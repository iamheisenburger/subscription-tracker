"use client";

import { Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ActivityFeed } from "@/components/dashboard/insights/activity-feed";
import { PriceHistoryChart } from "@/components/dashboard/insights/price-history-chart";
import { AlertsTab } from "@/components/dashboard/insights/alerts-tab";
import { SavingsTab } from "@/components/dashboard/insights/savings-tab";
import { AutomationHealthTab } from "@/components/dashboard/insights/automation-health-tab";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

function InsightsContent() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") || "activity";
  const validTabs = new Set([
    "activity",
    "savings",
    "price-history",
    "email-detection",
  ]);
  const defaultTab = validTabs.has(requestedTab) ? requestedTab : "activity";
  const subscriptionId = searchParams.get("sub");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-sans">
              Insights & Activity
            </h1>
            <p className="text-muted-foreground font-sans mt-1 text-sm sm:text-base">
              See what SubWise has detected, how prices changed, and how your
              email automation is performing.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-5">
        <TabsList className="flex w-full flex-nowrap gap-2 overflow-x-auto rounded-2xl bg-muted/30 p-1 sm:w-auto sm:flex-wrap sm:justify-start">
          <TabsTrigger value="activity" className="font-sans flex-1 min-w-[120px] whitespace-nowrap sm:flex-none">
            Activity
          </TabsTrigger>
          <TabsTrigger value="savings" className="font-sans flex-1 min-w-[120px] whitespace-nowrap sm:flex-none">
            Savings
          </TabsTrigger>
          <TabsTrigger value="price-history" className="font-sans flex-1 min-w-[120px] whitespace-nowrap sm:flex-none">
            Price History
          </TabsTrigger>
          <TabsTrigger value="email-detection" className="font-sans flex-1 min-w-[120px] whitespace-nowrap sm:flex-none">
            Email Detection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <ActivityFeed />
          {/* De-emphasized alerts section to keep notifications accessible */}
          <AlertsTab />
        </TabsContent>

        <TabsContent value="savings" className="space-y-4">
          <SavingsTab />
        </TabsContent>

        <TabsContent value="price-history" className="space-y-4">
          <PriceHistoryChart subscriptionId={subscriptionId} />
        </TabsContent>
        <TabsContent value="email-detection" className="space-y-4">
          <AutomationHealthTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function InsightsPage() {
  return (
    <Suspense fallback={<InsightsPageSkeleton />}>
      <InsightsContent />
    </Suspense>
  );
}

function InsightsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}
