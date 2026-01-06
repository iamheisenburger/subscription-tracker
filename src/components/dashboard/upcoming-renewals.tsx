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

  // Filter and sort upcoming renewals (next 30 days) - ONLY ACTIVE subscriptions
  const upcoming = subscriptions
    .filter(sub => {
      const daysUntil = Math.ceil((sub.nextBillingDate - Date.now()) / (1000 * 60 * 60 * 24));
      return sub.isActive && daysUntil >= 0 && daysUntil <= 30;
    })
    .sort((a, b) => a.nextBillingDate - b.nextBillingDate)
    .slice(0, 5);

  return (
    <Card className="border border-border/50 shadow-sm bg-card rounded-2xl transition-all duration-300">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-xl font-bold font-sans tracking-tight">Upcoming Renewals</CardTitle>
        <CardDescription className="font-medium font-sans text-muted-foreground">Next 30 days</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {upcoming.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 bg-muted/20 rounded-2xl border border-dashed border-border">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-bold text-sm tracking-tight font-sans">Everything is quiet</p>
            <p className="text-xs font-sans">No renewals in the next 30 days</p>
          </div>
        ) : (
          <div className="space-y-6">
            {upcoming.map((subscription) => {
              const daysUntil = Math.ceil((subscription.nextBillingDate - Date.now()) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={subscription._id} className="flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:bg-primary/10 transition-colors">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-base font-sans leading-none mb-1">{subscription.name}</p>
                      <p className="text-xs text-muted-foreground font-bold font-sans">
                        {format(subscription.nextBillingDate, "MMM dd")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <div className="font-black text-sm font-sans">
                      {subscription.currency} {subscription.cost.toFixed(2)}
                    </div>
                    <Badge 
                      variant={daysUntil <= 3 ? "destructive" : daysUntil <= 7 ? "secondary" : "outline"}
                      className="text-[10px] font-black uppercase tracking-tighter px-1.5 py-0 h-5"
                    >
                      {daysUntil === 0 ? "Today" : `${daysUntil}d left`}
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
