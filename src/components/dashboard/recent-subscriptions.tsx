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
}

export function RecentSubscriptions({ userId }: RecentSubscriptionsProps) {
  const subscriptions = useQuery(api.subscriptions.getUserSubscriptions, { clerkId: userId });
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

  if (subscriptions === undefined) {
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

  if (subscriptions.length === 0) {
    return (
      <Card className="rounded-2xl border border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Your Subscriptions</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Manage your active subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No subscriptions yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Add your first subscription to get started tracking your expenses.
          </p>
          <AddSubscriptionDialog>
            <Button className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Subscription
            </Button>
          </AddSubscriptionDialog>
        </CardContent>
      </Card>
    );
  }

  const recentSubscriptions = subscriptions.slice(0, 5);

  return (
    <Card className="rounded-2xl border border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg font-semibold">Your Subscriptions</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Active and recently managed
          </CardDescription>
        </div>
        <Link href="/dashboard/subscriptions">
          <Button variant="ghost" size="sm" className="rounded-xl text-primary hover:bg-primary/5">
            See All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentSubscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription._id}
              subscription={subscription}
              showCategory={true}
              currency="USD" // Will be replaced with user preference later
              hasDuplicateAlert={duplicateAlertMap.get(subscription._id) === true}
            />
          ))}
        </div>
        {subscriptions.length > 5 && (
          <div className="text-center pt-4">
            <Link href="/dashboard/subscriptions">
              <Button variant="outline" size="sm" className="rounded-xl">
                View All Subscriptions
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
