"use client";

import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export function SavingsCelebration() {
  const { user } = useUser();
  
  const subscriptions = useQuery(api.subscriptions.getUserSubscriptions, user?.id ? { clerkId: user.id } : "skip");

  // Calculate savings from cancelled subscriptions
  const cancelledSubscriptions = subscriptions?.filter(sub => !sub.isActive) || [];
  
  const totalSavings = cancelledSubscriptions.reduce((total, sub) => {
    let monthlyCost = sub.cost;
    if (sub.billingCycle === "yearly") {
      monthlyCost = sub.cost / 12;
    } else if (sub.billingCycle === "weekly") {
      monthlyCost = sub.cost * 4.33;
    }
    return total + monthlyCost;
  }, 0);

  const yearlySavings = totalSavings * 12;

  if (!cancelledSubscriptions.length) {
    return null; // Don't show if no cancelled subscriptions
  }

  return (
    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
            <span className="text-lg">💰</span>
          </div>
          <div>
            <h4 className="font-semibold text-green-700 text-sm">
              You&apos;re saving ${totalSavings.toFixed(2)}/month
            </h4>
            <p className="text-xs text-green-600/80">
              ${yearlySavings.toFixed(2)}/year from {cancelledSubscriptions.length} cancelled subscription{cancelledSubscriptions.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-green-600 text-xs">
          {cancelledSubscriptions.length} cancelled
        </Badge>
      </div>
    </div>
  );
}
