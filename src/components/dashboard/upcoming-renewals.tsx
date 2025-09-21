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
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Filter and sort upcoming renewals (next 30 days)
  const upcoming = subscriptions
    .filter(sub => {
      const daysUntil = Math.ceil((sub.nextBillingDate - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 30;
    })
    .sort((a, b) => a.nextBillingDate - b.nextBillingDate)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans">Upcoming Renewals</CardTitle>
        <CardDescription className="font-sans">Next 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 font-sans">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No upcoming renewals</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((subscription) => {
              const daysUntil = Math.ceil((subscription.nextBillingDate - Date.now()) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={subscription._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium font-sans">{subscription.name}</p>
                      <p className="text-sm text-muted-foreground font-sans">
                        {format(subscription.nextBillingDate, "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-semibold font-sans">
                      {subscription.currency} {subscription.cost.toFixed(2)}
                    </div>
                    <Badge 
                      variant={daysUntil <= 3 ? "destructive" : daysUntil <= 7 ? "secondary" : "outline"}
                      className="text-xs font-sans"
                    >
                      {daysUntil === 0 ? "Today" : `${daysUntil} days`}
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
