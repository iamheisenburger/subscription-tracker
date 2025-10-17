"use client";

/**
 * Insights Page - Central hub for automation features
 * Shows activity feed, price history, predictions, and alerts
 */

import { Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ActivityFeed } from "@/components/dashboard/insights/activity-feed";
import { PriceHistoryChart } from "@/components/dashboard/insights/price-history-chart";
import { PredictionsList } from "@/components/dashboard/insights/predictions-list";
import { AlertsTab } from "@/components/dashboard/insights/alerts-tab";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

function InsightsContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "activity";
  const subscriptionId = searchParams.get("sub");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-3">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-sans">
            Insights & Activity
          </h1>
          <p className="text-muted-foreground font-sans mt-1">
            Track your subscription automation, price changes, and predictions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="activity" className="font-sans">
            Activity Feed
          </TabsTrigger>
          <TabsTrigger value="price-history" className="font-sans">
            Price History
          </TabsTrigger>
          <TabsTrigger value="predictions" className="font-sans">
            Predictions
          </TabsTrigger>
          <TabsTrigger value="alerts" className="font-sans">
            Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <ActivityFeed />
        </TabsContent>

        <TabsContent value="price-history" className="space-y-4">
          <PriceHistoryChart subscriptionId={subscriptionId} />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <PredictionsList />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertsTab />
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
