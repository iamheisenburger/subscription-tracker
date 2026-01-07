"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { SubscriptionCard } from "./subscription-card";
import { Sparkles } from "lucide-react";
import Link from "next/link";

interface RecentSubscriptionsProps {
  userId: string;
}

export function RecentSubscriptions({ userId }: RecentSubscriptionsProps) {
  const subscriptions = useQuery(api.subscriptions.getSubscriptions, { clerkId: userId });

  if (!subscriptions) {
    return (
      <div className="bg-card rounded-2xl border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Subscriptions</h2>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const activeSubscriptions = subscriptions
    .filter(sub => sub.status === "active")
    .sort((a, b) => b._creationTime - a._creationTime)
    .slice(0, 5);

  return (
    <div className="bg-card rounded-2xl border border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold">Subscriptions</h2>
        <Link href="/dashboard/subscriptions">
          <Button variant="ghost" size="sm" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            View All
          </Button>
        </Link>
      </div>
      <div className="p-4">
        {activeSubscriptions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-semibold text-lg mb-1">No subscriptions yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first subscription to start tracking
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription._id}
                subscription={subscription}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
