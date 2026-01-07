"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Calendar } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { cn } from "@/lib/utils";

interface UpcomingRenewalsProps {
  userId: string;
}

export function UpcomingRenewals({ userId }: UpcomingRenewalsProps) {
  const subscriptions = useQuery(api.subscriptions.getSubscriptions, { clerkId: userId });
  const { formatAmount, convertAmount } = useCurrency();

  if (!subscriptions) {
    return (
      <div className="bg-card rounded-2xl border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Upcoming</h2>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const now = new Date();
  const upcomingRenewals = subscriptions
    .filter(sub => sub.status === "active")
    .map(sub => ({
      ...sub,
      daysUntil: Math.ceil((sub.nextBillingDate - now.getTime()) / (1000 * 60 * 60 * 24))
    }))
    .filter(sub => sub.daysUntil >= 0 && sub.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-card rounded-2xl border border-border">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Upcoming</h2>
      </div>
      <div className="p-4">
        {upcomingRenewals.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No renewals in the next 30 days
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingRenewals.map((sub) => {
              const isUrgent = sub.daysUntil <= 3;
              return (
                <div 
                  key={sub._id} 
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl",
                    isUrgent ? "bg-destructive/10" : "bg-muted/50"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{sub.name}</p>
                    <p className={cn(
                      "text-xs",
                      isUrgent ? "text-destructive font-medium" : "text-muted-foreground"
                    )}>
                      {sub.daysUntil === 0 ? "Today" : sub.daysUntil === 1 ? "Tomorrow" : `${sub.daysUntil} days`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">
                      {formatAmount(convertAmount(sub.cost, sub.currency))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(sub.nextBillingDate)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
