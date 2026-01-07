"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target, ChevronRight } from "lucide-react";
import Link from "next/link";
import { AddSubscriptionDialog } from "@/components/dashboard/add-subscription-dialog";
import { SubscriptionCard } from "./subscription-card";

interface RecentSubscriptionsProps {
  userId: string;
  search?: string;
  sortBy?: string;
  categories?: string[];
  billing?: string[];
}

export function RecentSubscriptions({ 
  userId, 
  search = "", 
  sortBy = "name", 
  categories = [], 
  billing = [] 
}: RecentSubscriptionsProps) {
  const allSubscriptions = useQuery(api.subscriptions.getUserSubscriptions, { clerkId: userId });
  const notifications = useQuery(api.insights.getNotificationHistory, {
    clerkUserId: userId,
    limit: 200,
  });

  const duplicateAlertMap = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!notifications) return map;

    notifications.forEach((n) => {
      if (!n.read && typeof n.type === "string" && n.type.includes("duplicate")) {
        const meta = n.metadata as { subscriptionId?: string } | undefined;
        const subId = meta?.subscriptionId;
        if (subId) {
          map.set(subId, true);
        }
      }
    });

    return map;
  }, [notifications]);

  const filteredSubscriptions = useMemo(() => {
    if (!allSubscriptions) return undefined;

    const result = allSubscriptions.filter((sub) => {
      // Search filter
      if (search && !sub.name.toLowerCase().includes(search.toLowerCase())) return false;
      
      // Multi-select billing cycle filter
      if (billing && billing.length > 0 && !billing.includes(sub.billingCycle)) return false;
      
      // Multi-select category filter
      if (categories && categories.length > 0 && !categories.includes(sub.category || "other")) return false;
      
      return true;
    });

    // Sort (create new sorted array)
    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "cost_high":
          return b.cost - a.cost;
        case "cost_low":
          return a.cost - b.cost;
        case "renewal":
          return a.nextBillingDate - b.nextBillingDate;
        default:
          return 0;
      }
    });

    return sorted;
  }, [allSubscriptions, search, billing, categories, sortBy]);

  if (filteredSubscriptions === undefined) {
    return (
      <Card className="rounded-2xl border border-border">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 bg-muted/30 rounded-xl">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                  <Skeleton className="h-3 w-1/2 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (allSubscriptions?.length === 0) {
    return (
      <Card className="rounded-2xl border border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold">Your Subscriptions</CardTitle>
          <CardDescription className="text-sm font-medium text-muted-foreground">
            Manage your active subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-2">No subscriptions yet</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Add your first subscription to get started tracking your expenses.
          </p>
          <AddSubscriptionDialog>
            <Button className="rounded-xl h-12 px-6 bg-[#1F2937] hover:bg-[#1F2937]/90 font-bold">
              <Plus className="mr-2 h-5 w-5" />
              Add Your First Subscription
            </Button>
          </AddSubscriptionDialog>
        </CardContent>
      </Card>
    );
  }

  if (filteredSubscriptions.length === 0) {
    return (
      <Card className="rounded-2xl border border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg font-bold">Your Subscriptions</CardTitle>
            <CardDescription className="text-sm font-medium text-muted-foreground">
              No matches found for your search/filters
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground text-sm">
            Try adjusting your search query or filters to find what you&apos;re looking for.
          </p>
        </CardContent>
      </Card>
    );
  }

  // If searching or filtering, show all results. If not, show top 5.
  const isFiltered = search || categories.length > 0 || billing.length > 0 || sortBy !== "name";
  const displaySubscriptions = isFiltered ? filteredSubscriptions : filteredSubscriptions.slice(0, 5);

  return (
    <Card className="rounded-2xl border border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg font-bold">Your Subscriptions</CardTitle>
          <CardDescription className="text-sm font-medium text-muted-foreground">
            {isFiltered ? `${filteredSubscriptions.length} matches found` : "Active and recently managed"}
          </CardDescription>
        </div>
        {!isFiltered && (
          <Link href="/dashboard/subscriptions">
            <Button variant="ghost" size="sm" className="rounded-xl text-[#1F2937] font-bold hover:bg-[#1F2937]/5">
              See All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displaySubscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription._id}
              subscription={subscription}
              showCategory={true}
              currency="USD"
              hasDuplicateAlert={duplicateAlertMap.get(subscription._id) === true}
            />
          ))}
        </div>
        {!isFiltered && allSubscriptions && allSubscriptions.length > 5 && (
          <div className="text-center pt-4">
            <Link href="/dashboard/subscriptions">
              <Button variant="outline" size="sm" className="rounded-xl font-bold border-border/50 text-[#1F2937]">
                View All {allSubscriptions.length} Subscriptions
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
