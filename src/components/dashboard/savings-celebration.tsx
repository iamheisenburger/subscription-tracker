"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <Card className="border-green-500/20 bg-green-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎉 Your Money-Saving Journey
          <Badge variant="outline" className="text-green-600">
            {cancelledSubscriptions.length} cancelled
          </Badge>
        </CardTitle>
        <CardDescription>
          SubWise helped you identify and cancel unnecessary subscriptions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Monthly Savings */}
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              ${totalSavings.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">Monthly Savings</p>
          </div>

          {/* Yearly Savings */}
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              ${yearlySavings.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">Yearly Savings</p>
          </div>

          {/* Cancelled Count */}
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {cancelledSubscriptions.length}
            </div>
            <p className="text-sm text-muted-foreground">Subscriptions Cancelled</p>
          </div>
        </div>

        {/* Cancelled Subscriptions List */}
        <div className="space-y-2 mb-6">
          <h4 className="font-semibold text-sm">Cancelled Subscriptions:</h4>
          <div className="flex flex-wrap gap-2">
            {cancelledSubscriptions.map((sub) => (
              <Badge key={sub._id} variant="outline" className="text-green-600">
                {sub.name} (${sub.cost}/{sub.billingCycle})
              </Badge>
            ))}
          </div>
        </div>

        {/* Motivational Message */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
          <h5 className="font-semibold text-green-600 mb-2">
            🌟 Great Job Managing Your Subscriptions!
          </h5>
          <p className="text-sm text-green-600/80">
            By staying on top of your subscriptions with SubWise, you&apos;ve saved <strong>${yearlySavings.toFixed(2)} per year</strong>. 
            This shows how valuable it is to track and manage your recurring expenses!
          </p>
        </div>

        {/* Call to Action */}
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm">
            📊 View Analytics
          </Button>
          <Button variant="outline" size="sm">
            ➕ Add New Subscription
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
