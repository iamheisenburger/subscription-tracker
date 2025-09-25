"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { formatDistance } from "date-fns";
import { Calendar, DollarSign, TrendingDown, Trophy, CheckCircle, XCircle } from "lucide-react";

export function RenewalConfirmationPanel() {
  const { user } = useUser();
  const [processing, setProcessing] = useState<string | null>(null);
  const [newCosts, setNewCosts] = useState<Record<string, number>>({});

  const subscriptionsNeedingConfirmation = useQuery(
    api.subscription_renewal.getSubscriptionsNeedingConfirmation,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const confirmRenewal = useMutation(api.subscription_renewal.confirmSubscriptionRenewal);
  const savingsStats = useQuery(
    api.subscription_renewal.getSavingsStats,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const handleRenewalAction = async (
    subscriptionId: string,
    action: "renewed" | "cancelled",
    subscriptionName: string,
    newCost?: number
  ) => {
    if (!user?.id) return;
    
    setProcessing(`${action}_${subscriptionId}`);

    try {
      const result = await confirmRenewal({
        clerkId: user.id,
        subscriptionId: subscriptionId as Id<"subscriptions">,
        action,
        newCost
      });

      if (action === "renewed") {
        toast.success(`✅ ${subscriptionName} renewed!`, {
          description: result.message
        });
      } else {
        toast.success(`🎉 Congratulations!`, {
          description: result.rewardMessage,
          duration: 5000
        });
      }

      // Clear the new cost input
      setNewCosts(prev => {
        const updated = { ...prev };
        delete updated[subscriptionId];
        return updated;
      });

    } catch (error) {
      toast.error("Failed to update subscription", {
        description: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setProcessing(null);
    }
  };

  if (!subscriptionsNeedingConfirmation?.length && !savingsStats?.totalCancelledSubs) {
    return null;
  }

  return (
    <div className="space-y-6">
      
      {/* Savings Stats */}
      {savingsStats && savingsStats.totalCancelledSubs > 0 && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-500" />
              Your Money-Saving Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${savingsStats.totalMonthlySavings}
                </div>
                <p className="text-sm text-muted-foreground">Monthly Savings</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${savingsStats.totalYearlySavings}
                </div>
                <p className="text-sm text-muted-foreground">Yearly Savings</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {savingsStats.totalCancelledSubs}
                </div>
                <p className="text-sm text-muted-foreground">Subscriptions Cancelled</p>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              🎉 SubWise helped you save money on unnecessary subscriptions!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Renewal Confirmations */}
      {subscriptionsNeedingConfirmation && subscriptionsNeedingConfirmation.length > 0 && (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              Subscription Renewal Confirmations
              <Badge variant="secondary">
                {subscriptionsNeedingConfirmation.length} pending
              </Badge>
            </CardTitle>
            <CardDescription>
              These subscriptions have passed their renewal date. Please confirm if they were renewed or cancelled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscriptionsNeedingConfirmation.map((sub) => (
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
                    {sub.daysPastDue} days overdue
                  </Badge>
                </div>

                {/* Price Change Input */}
                <div className="flex items-center gap-2">
                  <Label htmlFor={`cost_${sub._id}`} className="text-sm">
                    Update cost if price changed:
                  </Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
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
                      className="w-24"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRenewalAction(
                      sub._id, 
                      "renewed", 
                      sub.name,
                      newCosts[sub._id] || undefined
                    )}
                    disabled={processing === `renewed_${sub._id}`}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {processing === `renewed_${sub._id}` ? "Processing..." : "Renewed"}
                  </Button>
                  <Button
                    onClick={() => handleRenewalAction(
                      sub._id, 
                      "cancelled", 
                      sub.name
                    )}
                    disabled={processing === `cancelled_${sub._id}`}
                    size="sm"
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    {processing === `cancelled_${sub._id}` ? "Processing..." : "Cancelled"}
                  </Button>
                </div>

                {/* Cancellation Savings Preview */}
                <div className="bg-muted/30 rounded p-2 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <TrendingDown className="h-4 w-4" />
                    <span>
                      Cancel to save: ${(sub.billingCycle === "yearly" ? sub.cost / 12 : sub.billingCycle === "weekly" ? sub.cost * 4.33 : sub.cost).toFixed(2)}/month
                      (${((sub.billingCycle === "yearly" ? sub.cost / 12 : sub.billingCycle === "weekly" ? sub.cost * 4.33 : sub.cost) * 12).toFixed(2)}/year)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
