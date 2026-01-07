"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface UpcomingRenewalsProps {
  userId: string;
}

export function UpcomingRenewals({ userId }: UpcomingRenewalsProps) {
  const subscriptions = useQuery(api.subscriptions.getUserSubscriptions, { clerkId: userId });

  if (subscriptions === undefined) {
    return (
      <Card className="rounded-2xl border border-border">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded-lg" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3 bg-muted/30 rounded-xl">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-3 w-1/2 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-12 rounded-lg" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Filter and sort upcoming renewals (next 30 days) - ONLY ACTIVE subscriptions
  const upcoming = subscriptions
    .filter(sub => {
      const daysUntil = Math.ceil((sub.nextBillingDate - Date.now()) / (1000 * 60 * 60 * 24));
      return sub.isActive && daysUntil >= 0 && daysUntil <= 30;
    })
    .sort((a, b) => a.nextBillingDate - b.nextBillingDate)
    .slice(0, 5);

  return (
    <Card className="rounded-2xl border border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Upcoming Renewals</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">Next 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
            <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium text-sm">Everything is quiet</p>
            <p className="text-xs text-muted-foreground">No renewals in the next 30 days</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((subscription) => {
              const daysUntil = Math.ceil((subscription.nextBillingDate - Date.now()) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={subscription._id} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{subscription.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(subscription.nextBillingDate, "MMM dd")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="font-semibold text-sm">
                      {subscription.currency} {subscription.cost.toFixed(2)}
                    </div>
                    <Badge 
                      className={`text-xs px-2 py-0.5 rounded-md ${
                        daysUntil <= 3 
                          ? 'bg-destructive/10 text-destructive border-destructive/30' 
                          : daysUntil <= 7 
                            ? 'bg-warning/10 text-warning border-warning/30' 
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {daysUntil === 0 ? "Today" : `${daysUntil}d`}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
