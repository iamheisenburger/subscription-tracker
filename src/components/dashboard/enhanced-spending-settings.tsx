"use client";

import { useState, useEffect, useMemo } from "react";
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
import { convertCurrency, getPreferredCurrency } from "@/lib/currency";

// Helper function to format currency based on user preference
const formatCurrency = (amount: number, currency: string) => {
  const symbol = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : currency === 'CAD' ? 'C$' : currency === 'AUD' ? 'A$' : '$';
  return `${symbol}${amount.toFixed(2)}`;
};

export function EnhancedSpendingSettings() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const updatePreferences = useMutation(api.notifications.updateNotificationPreferences);
  const subscriptions = useQuery(api.subscriptions.getUserSubscriptions, user?.id ? { clerkId: user.id } : "skip");
  const preferences = useQuery(api.notifications.getNotificationPreferences, user?.id ? { clerkId: user.id } : "skip");
  const userInfo = useQuery(api.users.getUserByClerkId, user?.id ? { clerkId: user.id } : "skip");

  // Get user's preferred currency and current threshold
  // Prefer client-selected currency for consistency across dashboard
  const userCurrency = (typeof window !== 'undefined' ? getPreferredCurrency() : null) || userInfo?.preferredCurrency || 'USD';
  const [monthlyThreshold, setMonthlyThreshold] = useState<number>(100);
  const [yearlyThreshold, setYearlyThreshold] = useState<number>(1200);
  const [alertPercentages, setAlertPercentages] = useState<number[]>([80, 100, 120]);
  const [currentSpending, setCurrentSpending] = useState<number>(0);
  const [conversionLoading, setConversionLoading] = useState(false);

  // Sync with preferences when loaded
  useEffect(() => {
    if (preferences?.spendingThreshold) {
      setMonthlyThreshold(preferences.spendingThreshold);
      setYearlyThreshold(preferences.spendingThreshold * 12);
    }
  }, [preferences]);

  // Calculate current spending with proper currency conversion - SAME AS OVERVIEW CARDS
  useEffect(() => {
    if (!subscriptions || !userCurrency) return;
    
    const calculateConvertedSpending = async () => {
      setConversionLoading(true);
      
      try {
        // Use EXACT SAME logic as overview-cards.tsx for consistency
        const monthlyAmounts = subscriptions.map(sub => {
          let monthlyAmount = sub.cost;
          if (sub.billingCycle === "yearly") {
            monthlyAmount = sub.cost / 12;
          } else if (sub.billingCycle === "weekly") {
            monthlyAmount = sub.cost * 4.33; // Average weeks per month
          }

          return {
            amount: monthlyAmount,
            currency: sub.currency || 'USD'
          };
        });

        // Use the SAME convertMultipleCurrencies function as overview-cards
        const { convertMultipleCurrencies } = await import('@/lib/currency');
        const conversions = await convertMultipleCurrencies(monthlyAmounts, userCurrency);
        const monthlyTotal = conversions.reduce((sum, conv) => sum + conv.convertedAmount, 0);
        
        setCurrentSpending(Math.round(monthlyTotal * 100) / 100);
      } catch (error) {
        console.error("Currency conversion failed:", error);
        setCurrentSpending(0);
      } finally {
        setConversionLoading(false);
      }
    };

    calculateConvertedSpending();
  }, [subscriptions, userCurrency]);

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
                {conversionLoading ? (
                  <span className="text-muted-foreground">Converting...</span>
                ) : (
                  formatCurrency(currentSpending, userCurrency)
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {Math.round(spendingPercentage)}% of budget
                {userCurrency !== 'USD' && !conversionLoading && (
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
                  value={monthlyThreshold}
                  onChange={(e) => setMonthlyThreshold(parseFloat(e.target.value) || 0)}
                  placeholder="100"
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
                  value={yearlyThreshold}
                  onChange={(e) => setYearlyThreshold(parseFloat(e.target.value) || 0)}
                  placeholder="1200"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(yearlyThreshold / 12, userCurrency)}/month equivalent
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
