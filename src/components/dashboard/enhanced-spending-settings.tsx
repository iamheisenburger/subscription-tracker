"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export function EnhancedSpendingSettings() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [monthlyThreshold, setMonthlyThreshold] = useState<number>(100);
  const [yearlyThreshold, setYearlyThreshold] = useState<number>(1200);
  const [alertPercentages, setAlertPercentages] = useState<number[]>([80, 100, 120]);

  const updatePreferences = useMutation(api.notifications.updateNotificationPreferences);
  const subscriptions = useQuery(api.subscriptions.getUserSubscriptions, user?.id ? { clerkId: user.id } : "skip");
  const preferences = useQuery(api.notifications.getNotificationPreferences, user?.id ? { clerkId: user.id } : "skip");

  // Calculate current spending
  const currentSpending = subscriptions?.reduce((total, sub) => {
    let monthlyCost = sub.cost;
    if (sub.billingCycle === "yearly") {
      monthlyCost = sub.cost / 12;
    } else if (sub.billingCycle === "weekly") {
      monthlyCost = sub.cost * 4.33;
    }
    return total + monthlyCost;
  }, 0) || 0;

  const spendingPercentage = monthlyThreshold > 0 ? (currentSpending / monthlyThreshold) * 100 : 0;
  const isOverBudget = currentSpending > monthlyThreshold;

  const handleSaveThresholds = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      await updatePreferences({
        clerkId: user.id,
        spendingThreshold: monthlyThreshold,
        spendingAlerts: true,
      });

      toast.success("✅ Spending thresholds updated", {
        description: `Monthly: $${monthlyThreshold}, Yearly: $${yearlyThreshold}`
      });
    } catch (error) {
      toast.error("❌ Failed to update spending thresholds", {
        description: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💎 Enhanced Spending Management
          <Badge variant="secondary" className="text-blue-600">Premium</Badge>
        </CardTitle>
        <CardDescription>
          Advanced spending insights, multiple thresholds, and smart budget management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Current Spending Overview */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">Current Monthly Spending</h4>
            <div className="text-right">
              <div className="text-2xl font-bold">
                ${currentSpending.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                {Math.round(spendingPercentage)}% of budget
              </div>
            </div>
          </div>
          
          <Progress 
            value={Math.min(spendingPercentage, 120)} 
            className={`h-3 ${isOverBudget ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'}`}
          />
          
          {isOverBudget && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-600 font-medium">
                🚨 Over Budget: ${(currentSpending - monthlyThreshold).toFixed(2)}
              </p>
              <p className="text-sm text-red-600/80">
                Consider reviewing your subscriptions or adjusting your budget
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Budget Configuration */}
        <div className="space-y-4">
          <h4 className="font-semibold">Budget Thresholds</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthly-threshold">Monthly Budget</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground">$</span>
                <Input
                  id="monthly-threshold"
                  type="number"
                  value={monthlyThreshold}
                  onChange={(e) => setMonthlyThreshold(parseFloat(e.target.value) || 0)}
                  placeholder="100"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="yearly-threshold">Yearly Budget</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground">$</span>
                <Input
                  id="yearly-threshold"
                  type="number"
                  value={yearlyThreshold}
                  onChange={(e) => setYearlyThreshold(parseFloat(e.target.value) || 0)}
                  placeholder="1200"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ${(yearlyThreshold / 12).toFixed(2)}/month equivalent
              </p>
            </div>
          </div>

          {/* Alert Percentages */}
          <div>
            <Label>Alert Triggers</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Get notified when you reach these percentages of your budget
            </p>
            <div className="flex gap-2 flex-wrap">
              {alertPercentages.map((percentage, index) => (
                <Badge 
                  key={index}
                  variant={percentage >= 100 ? "destructive" : "secondary"}
                  className="text-sm"
                >
                  {percentage}%
                </Badge>
              ))}
            </div>
          </div>

          {/* Smart Recommendations */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h5 className="font-medium text-blue-600 mb-2">💡 Smart Recommendations</h5>
            <div className="space-y-1 text-sm">
              {currentSpending > monthlyThreshold && (
                <p>• Consider reviewing your highest-cost subscriptions</p>
              )}
              {subscriptions && subscriptions.length > 10 && (
                <p>• You have {subscriptions.length} subscriptions - consider consolidating similar services</p>
              )}
              {currentSpending < monthlyThreshold * 0.5 && (
                <p>• Your spending is healthy - consider increasing your budget if needed</p>
              )}
            </div>
          </div>

          <Button 
            onClick={handleSaveThresholds}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Saving..." : "Save Spending Preferences"}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
