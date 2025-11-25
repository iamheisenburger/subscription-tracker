"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { formatDistance } from "date-fns";

export function RenewalConfirmationSystem() {
  const { user } = useUser();
  const [processing, setProcessing] = useState<string | null>(null);
  const [newCosts, setNewCosts] = useState<Record<string, number>>({});

  const subscriptions = useQuery(api.subscriptions.getUserSubscriptions, user?.id ? { clerkId: user.id } : "skip");
  const updateSubscription = useMutation(api.subscriptions.updateSubscription);

  // Find subscriptions that have passed their renewal date
  const expiredSubscriptions = subscriptions?.filter(sub => {
    const now = Date.now();
    const daysPastDue = Math.floor((now - sub.nextBillingDate) / (1000 * 60 * 60 * 24));
    return sub.isActive && daysPastDue > 0 && daysPastDue <= 30; // Expired but within 30 days
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
        // Calculate next billing date (+30 days or +365 days)
        const now = Date.now();
        const daysToAdd = billingCycle === "yearly" ? 365 : billingCycle === "weekly" ? 7 : 30;
        const nextBillingDate = now + (daysToAdd * 24 * 60 * 60 * 1000);
        
        // Update subscription with new billing date and optionally new cost
        const newCost = newCosts[subscriptionId] || originalCost;
        
        await updateSubscription({
          clerkId: user.id,
          subscriptionId: subscriptionId as Id<"subscriptions">,
          cost: newCost,
          nextBillingDate: nextBillingDate,
        });

        toast.success(`✅ ${subscriptionName} renewed!`, {
          description: `Next billing: ${new Date(nextBillingDate).toLocaleDateString()}`
        });

        // Clear the cost input
        setNewCosts(prev => {
          const updated = { ...prev };
          delete updated[subscriptionId];
          return updated;
        });

      } else {
        // Mark subscription as cancelled
        await updateSubscription({
          clerkId: user.id,
          subscriptionId: subscriptionId as Id<"subscriptions">,
          isActive: false,
        });

        // Calculate and show savings
        const monthlySavings = billingCycle === "yearly" 
          ? originalCost / 12 
          : billingCycle === "weekly"
          ? originalCost * 4.33
          : originalCost;
        const yearlySavings = monthlySavings * 12;

        toast.success(`🎉 Congratulations!`, {
          description: `You're saving $${monthlySavings.toFixed(2)}/month ($${yearlySavings.toFixed(2)}/year)!`,
          duration: 5000
        });
      }

    } catch (error) {
      toast.error("❌ Failed to update subscription", {
        description: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setProcessing(null);
    }
  };

  if (!expiredSubscriptions.length) {
    return null; // Don't show if no expired subscriptions
  }

  return (
    <Card className="border-orange-500/20 bg-orange-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📅 Subscription Renewal Confirmations
          <Badge variant="secondary">
            {expiredSubscriptions.length} pending
          </Badge>
        </CardTitle>
        <CardDescription>
          These subscriptions have passed their renewal date. Please confirm if they were renewed or cancelled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {expiredSubscriptions.map((sub) => {
          const daysPastDue = Math.floor((Date.now() - sub.nextBillingDate) / (1000 * 60 * 60 * 24));
          const monthlySavings = sub.billingCycle === "yearly" 
            ? sub.cost / 12 
            : sub.billingCycle === "weekly"
            ? sub.cost * 4.33
            : sub.cost;
          const yearlySavings = monthlySavings * 12;

          return (
            <div 
              key={sub._id} 
              className="border border-border/50 rounded-lg p-4 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{sub.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Was due {formatDistance(sub.nextBillingDate, Date.now(), { addSuffix: true })}
                  </p>
                  <p className="text-sm">
                    {sub.currency} {sub.cost.toFixed(2)}/{sub.billingCycle}
                  </p>
                </div>
                <Badge variant="outline" className="text-orange-600">
                  {daysPastDue} days overdue
                </Badge>
              </div>

              {/* Price Update Input */}
              <div className="space-y-2">
                <Label htmlFor={`cost_${sub._id}`} className="text-sm">
                  Update cost if price changed:
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id={`cost_${sub._id}`}
                    type="number"
                    step="0.01"
                    placeholder={sub.cost.toFixed(2)}
                    value={newCosts[sub._id] || ""}
                    onChange={(e) => setNewCosts(prev => ({
                      ...prev,
                      [sub._id]: parseFloat(e.target.value) || 0
                    }))}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">/{sub.billingCycle}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleRenewalAction(
                    sub._id, 
                    "renewed", 
                    sub.name,
                    sub.cost,
                    sub.billingCycle
                  )}
                  disabled={processing === `renewed_${sub._id}`}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processing === `renewed_${sub._id}` ? "Processing..." : "✅ Renewed"}
                </Button>
                <Button
                  onClick={() => handleRenewalAction(
                    sub._id, 
                    "cancelled", 
                    sub.name,
                    sub.cost,
                    sub.billingCycle
                  )}
                  disabled={processing === `cancelled_${sub._id}`}
                  size="sm"
                  variant="destructive"
                >
                  {processing === `cancelled_${sub._id}` ? "Processing..." : "❌ Cancelled"}
                </Button>
              </div>

              {/* Savings Preview */}
              <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
                <div className="text-sm">
                  <div className="font-medium text-green-600 mb-1">💰 Savings if cancelled:</div>
                  <div className="text-green-600">
                    • ${monthlySavings.toFixed(2)}/month
                  </div>
                  <div className="text-green-600">
                    • ${yearlySavings.toFixed(2)}/year
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
