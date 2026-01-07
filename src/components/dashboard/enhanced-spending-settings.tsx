"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { getPreferredCurrency } from "@/lib/currency";
import { DollarSign, TrendingUp, AlertTriangle, Check, Bell } from "lucide-react";

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

  const spendingPercentage = monthlyThreshold > 0 ? (currentSpending / monthlyThreshold) * 100 : 0;
  const isOverBudget = currentSpending > monthlyThreshold;
  const isNearBudget = spendingPercentage >= 80 && !isOverBudget;

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
    <div className="space-y-6">
      {/* Current Spending Card - Mobile app style */}
      <Card className="rounded-2xl border border-border overflow-hidden">
        <div className={`p-6 ${
          isOverBudget 
            ? 'bg-destructive text-destructive-foreground' 
            : isNearBudget 
              ? 'bg-warning text-warning-foreground' 
              : 'bg-primary text-primary-foreground'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm opacity-80">Current Monthly Spending</p>
                <p className="text-3xl font-bold">
                  {analytics === undefined ? (
                    <span className="opacity-50">Loading...</span>
                  ) : (
                    formatCurrency(currentSpending, userCurrency)
                  )}
                </p>
              </div>
            </div>
            <Badge className={`${
              isOverBudget 
                ? 'bg-white/20 text-white' 
                : isNearBudget 
                  ? 'bg-white/20 text-white' 
                  : 'bg-success text-success-foreground'
            } rounded-lg px-3 py-1`}>
              {isOverBudget ? 'Over Budget' : isNearBudget ? 'Near Limit' : 'On Track'}
            </Badge>
          </div>
          
          {monthlyThreshold > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm opacity-80">
                <span>Budget Progress</span>
                <span>{Math.round(spendingPercentage)}%</span>
              </div>
              <Progress 
                value={Math.min(spendingPercentage, 100)} 
                className="h-3 bg-white/20 [&>div]:bg-white"
              />
              <p className="text-sm opacity-80">
                {formatCurrency(monthlyThreshold - currentSpending, userCurrency)} remaining of {formatCurrency(monthlyThreshold, userCurrency)}
              </p>
            </div>
          )}
        </div>

        {isOverBudget && (
          <div className="p-4 bg-destructive/10 border-t border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Over Budget Alert</p>
                <p className="text-sm text-destructive/80">
                  You've exceeded your budget by {formatCurrency(currentSpending - monthlyThreshold, userCurrency)}. Consider reviewing your subscriptions.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Budget Configuration Card */}
      <Card className="rounded-2xl border border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Budget Thresholds
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Set your spending limits to stay on track
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly-threshold" className="text-sm font-medium">Monthly Budget</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {userCurrency === 'GBP' ? '£' : userCurrency === 'EUR' ? '€' : userCurrency === 'CAD' ? 'C$' : userCurrency === 'AUD' ? 'A$' : '$'}
                </span>
                <Input
                  id="monthly-threshold"
                  type="number"
                  value={monthlyThreshold || ''}
                  onChange={(e) => setMonthlyThreshold(parseFloat(e.target.value) || 0)}
                  placeholder="100.00"
                  className="pl-8 rounded-xl bg-muted/40 border-border/50"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="yearly-threshold" className="text-sm font-medium">Yearly Budget</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {userCurrency === 'GBP' ? '£' : userCurrency === 'EUR' ? '€' : userCurrency === 'CAD' ? 'C$' : userCurrency === 'AUD' ? 'A$' : '$'}
                </span>
                <Input
                  id="yearly-threshold"
                  type="number"
                  value={yearlyThreshold || ''}
                  onChange={(e) => setYearlyThreshold(parseFloat(e.target.value) || 0)}
                  placeholder="1200.00"
                  className="pl-8 rounded-xl bg-muted/40 border-border/50"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(yearlyThreshold / 12, userCurrency)}/month equivalent
              </p>
            </div>
          </div>

          <Button 
            onClick={handleSaveThresholds}
            disabled={loading}
            className="w-full rounded-xl h-12 font-semibold"
          >
            {loading ? "Saving..." : "Save Budget"}
          </Button>
        </CardContent>
      </Card>

      {/* Alert Triggers Card */}
      <Card className="rounded-2xl border border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Alert Triggers
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Get notified at these spending milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { percentage: 80, label: 'Warning', color: 'bg-warning/10 border-warning/30 text-warning' },
              { percentage: 100, label: 'Reached', color: 'bg-destructive/10 border-destructive/30 text-destructive' },
              { percentage: 120, label: 'Exceeded', color: 'bg-destructive/20 border-destructive/50 text-destructive' },
            ].map((trigger) => (
              <div 
                key={trigger.percentage}
                className={`p-4 border-2 rounded-xl text-center ${trigger.color}`}
              >
                <div className="text-2xl font-bold">{trigger.percentage}%</div>
                <div className="text-xs mt-1 opacity-80">{trigger.label}</div>
                <Check className="w-4 h-4 mx-auto mt-2 opacity-60" />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            You'll receive email notifications when your spending reaches these percentages.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
