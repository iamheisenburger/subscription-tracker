"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Calendar, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function RenewalConfirmationSystem() {
  const { user } = useUser();
  const [processing, setProcessing] = useState<string | null>(null);
  const [newCosts, setNewCosts] = useState<Record<string, number>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const subscriptions = useQuery(api.subscriptions.getUserSubscriptions, user?.id ? { clerkId: user.id } : "skip");
  const updateSubscription = useMutation(api.subscriptions.updateSubscription);

  // Find subscriptions that have passed their renewal date
  const expiredSubscriptions = subscriptions?.filter(sub => {
    const now = Date.now();
    const daysPastDue = Math.floor((now - sub.nextBillingDate) / (1000 * 60 * 60 * 24));
    return sub.isActive && daysPastDue > 0 && daysPastDue <= 30;
  }) || [];

  const handleRenewalAction = async (
    subscriptionId: string,
    action: "renewed" | "cancelled",
    subscriptionName: string,
    originalCost: number,
    billingCycle: string
  ) => {
    if (!user?.id) return;
    setProcessing(`${action}_${subscriptionId}`);

    try {
      if (action === "renewed") {
        const now = Date.now();
        const daysToAdd = billingCycle === "yearly" ? 365 : billingCycle === "weekly" ? 7 : 30;
        const nextBillingDate = now + (daysToAdd * 24 * 60 * 60 * 1000);
        const newCost = newCosts[subscriptionId] || originalCost;
        
        await updateSubscription({
          clerkId: user.id,
          subscriptionId: subscriptionId as Id<"subscriptions">,
          cost: newCost,
          nextBillingDate: nextBillingDate,
        });

        toast.success(`${subscriptionName} renewed!`, {
          description: `Next billing: ${new Date(nextBillingDate).toLocaleDateString()}`
        });

        setNewCosts(prev => {
          const updated = { ...prev };
          delete updated[subscriptionId];
          return updated;
        });

      } else {
        await updateSubscription({
          clerkId: user.id,
          subscriptionId: subscriptionId as Id<"subscriptions">,
          isActive: false,
        });

        const monthlySavings = billingCycle === "yearly" 
          ? originalCost / 12 
          : billingCycle === "weekly"
          ? originalCost * 4.33
          : originalCost;
        const yearlySavings = monthlySavings * 12;

        toast.success(`Congratulations!`, {
          description: `You're saving $${monthlySavings.toFixed(2)}/month ($${yearlySavings.toFixed(2)}/year)!`,
          duration: 5000
        });
      }

    } catch (error) {
      toast.error("Failed to update subscription", {
        description: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setProcessing(null);
    }
  };

  if (!expiredSubscriptions.length) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Compact Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-warning" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">Renewal Confirmations</p>
            <p className="text-xs text-muted-foreground">
              {expiredSubscriptions.length} subscription{expiredSubscriptions.length > 1 ? 's' : ''} need{expiredSubscriptions.length === 1 ? 's' : ''} attention
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-lg">
            {expiredSubscriptions.length}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      <div className={cn(
        "overflow-hidden transition-all duration-300",
        isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Confirm if these subscriptions renewed or were cancelled.
          </p>
          
          {expiredSubscriptions.map((sub) => {
            const daysPastDue = Math.floor((Date.now() - sub.nextBillingDate) / (1000 * 60 * 60 * 24));
            const monthlySavings = sub.billingCycle === "yearly" 
              ? sub.cost / 12 
              : sub.billingCycle === "weekly"
              ? sub.cost * 4.33
              : sub.cost;

            return (
              <div 
                key={sub._id} 
                className="bg-muted/30 rounded-xl p-3 space-y-3"
              >
                {/* Subscription Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {sub.currency} {sub.cost.toFixed(2)}/{sub.billingCycle} • {daysPastDue}d overdue
                    </p>
                  </div>
                  <Badge variant="outline" className="text-warning border-warning/30 text-xs">
                    {daysPastDue}d
                  </Badge>
                </div>

                {/* Price Update - Compact */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">New price:</span>
                  <div className="flex items-center bg-card rounded-lg border border-border/50 overflow-hidden">
                    <span className="px-2 text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={sub.cost.toFixed(2)}
                      value={newCosts[sub._id] || ""}
                      onChange={(e) => setNewCosts(prev => ({
                        ...prev,
                        [sub._id]: parseFloat(e.target.value) || 0
                      }))}
                      className="w-20 h-8 border-0 bg-transparent text-sm px-1"
                    />
                  </div>
                </div>

                {/* Action Buttons - Compact */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRenewalAction(sub._id, "renewed", sub.name, sub.cost, sub.billingCycle)}
                    disabled={processing === `renewed_${sub._id}`}
                    size="sm"
                    className="flex-1 h-9 rounded-xl bg-success hover:bg-success/90 text-success-foreground"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {processing === `renewed_${sub._id}` ? "..." : "Renewed"}
                  </Button>
                  <Button
                    onClick={() => handleRenewalAction(sub._id, "cancelled", sub.name, sub.cost, sub.billingCycle)}
                    disabled={processing === `cancelled_${sub._id}`}
                    size="sm"
                    variant="destructive"
                    className="flex-1 h-9 rounded-xl"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {processing === `cancelled_${sub._id}` ? "..." : "Cancelled"}
                  </Button>
                </div>

                {/* Savings hint */}
                <p className="text-xs text-success">
                  Save ${monthlySavings.toFixed(2)}/mo if cancelled
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
