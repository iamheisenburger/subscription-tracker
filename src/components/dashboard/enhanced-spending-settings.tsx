"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { getPreferredCurrency } from "@/lib/currency";

// Helper function to format currency based on user preference
const formatCurrency = (amount: number, currency: string) => {
  const symbol = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : currency === 'CAD' ? 'C$' : currency === 'AUD' ? 'A$' : '$';
  return `${symbol}${amount.toFixed(2)}`;
};

export function EnhancedSpendingSettings() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const updatePreferences = useMutation(api.notifications.updateNotificationPreferences);
  // USE SAME ANALYTICS BACKEND AS OVERVIEW AND ANALYTICS - SINGLE SOURCE OF TRUTH
  const analytics = useQuery(api.subscriptions.getSubscriptionAnalytics, 
    user?.id ? {
      clerkId: user.id,
      targetCurrency: (typeof window !== 'undefined' ? getPreferredCurrency() : null) || 'USD',
    } : "skip"
  );
  const preferences = useQuery(api.notifications.getNotificationPreferences, user?.id ? { clerkId: user.id } : "skip");
  const userInfo = useQuery(api.users.getUserByClerkId, user?.id ? { clerkId: user.id } : "skip");

  // Get user's preferred currency and current threshold
  // Prefer client-selected currency for consistency across dashboard
  const userCurrency = (typeof window !== 'undefined' ? getPreferredCurrency() : null) || userInfo?.preferredCurrency || 'USD';
  const [monthlyThreshold, setMonthlyThreshold] = useState<number>(0);
  const [yearlyThreshold, setYearlyThreshold] = useState<number>(0);
  // Get current spending from analytics backend
  const currentSpending = analytics?.monthlyTotal || 0;

  // Sync with preferences when loaded
  useEffect(() => {
    if (preferences?.spendingThreshold) {
      setMonthlyThreshold(preferences.spendingThreshold);
      setYearlyThreshold(preferences.spendingThreshold * 12);
    }
  }, [preferences]);

  // No need for manual calculation - using backend analytics data

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

      // If user is over the new threshold, send immediate alert
      if (currentSpending > monthlyThreshold) {
        const overage = currentSpending - monthlyThreshold;
        toast.warning(`💰 New budget alert!`, {
          description: `You're ${formatCurrency(overage, userCurrency)} over your new ${formatCurrency(monthlyThreshold, userCurrency)} budget`,
          duration: 5000
        });

        // Send email notification about new threshold
        try {
          await fetch("/api/notifications/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "spending_alert",
              currentSpending: Math.round(currentSpending * 100) / 100,
              threshold: monthlyThreshold
            }),
          });
        } catch (emailError) {
          console.log("Failed to send threshold update email:", emailError);
        }
      }

      toast.success("✅ Spending thresholds updated", {
        description: `Monthly: ${formatCurrency(monthlyThreshold, userCurrency)}, Yearly: ${formatCurrency(yearlyThreshold, userCurrency)}`
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
          <span className="font-sans">Enhanced Spending Management</span>
          <Badge variant="secondary" className="text-blue-600">Plus</Badge>
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
                {analytics === undefined ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : (
                  formatCurrency(currentSpending, userCurrency)
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {Math.round(spendingPercentage)}% of budget
                {userCurrency !== 'USD' && analytics && (
                  <span className="block text-xs">Converted to {userCurrency}</span>
                )}
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
                🚨 Over Budget: {formatCurrency(currentSpending - monthlyThreshold, userCurrency)}
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
                <span className="text-muted-foreground">
                  {userCurrency === 'GBP' ? '£' : userCurrency === 'EUR' ? '€' : userCurrency === 'CAD' ? 'C$' : userCurrency === 'AUD' ? 'A$' : '$'}
                </span>
                <Input
                  id="monthly-threshold"
                  type="number"
                  value={monthlyThreshold || ''}
                  onChange={(e) => setMonthlyThreshold(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 100"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="yearly-threshold">Yearly Budget</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground">
                  {userCurrency === 'GBP' ? '£' : userCurrency === 'EUR' ? '€' : userCurrency === 'CAD' ? 'C$' : userCurrency === 'AUD' ? 'A$' : '$'}
                </span>
                <Input
                  id="yearly-threshold"
                  type="number"
                  value={yearlyThreshold || ''}
                  onChange={(e) => setYearlyThreshold(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 1200"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(yearlyThreshold / 12, userCurrency)}/month equivalent
              </p>
            </div>
          </div>

          {/* Alert Percentages */}
          <div>
            <Label htmlFor="alert-triggers">💎 Alert Triggers</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Get notified when you reach these percentages of your budget
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-md">
              {[80, 100, 120].map((percentage) => (
                <div 
                  key={percentage}
                  className={`p-3 sm:p-4 border-2 rounded-lg text-center transition-colors ${
                    percentage >= 100 
                      ? 'border-red-500/50 bg-red-500/10' 
                      : 'border-yellow-500/50 bg-yellow-500/10'
                  }`}
                >
                  <div className="text-2xl sm:text-3xl font-bold">{percentage}%</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {percentage === 80 ? 'Warning' : percentage === 100 ? 'Reached' : 'Exceeded'}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
              <p className="text-xs text-muted-foreground">
                <strong>Automatic alerts:</strong> You&apos;ll receive email notifications when your spending reaches 80%, 100%, and 120% of your budget threshold.
              </p>
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
