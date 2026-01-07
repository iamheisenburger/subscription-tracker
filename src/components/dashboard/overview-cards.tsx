"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DollarSign, CreditCard, TrendingUp, Calendar } from "lucide-react";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useCurrency } from "@/hooks/use-currency";

interface OverviewCardsProps {
  userId: string;
}

export function OverviewCards({ userId }: OverviewCardsProps) {
  const subscriptions = useQuery(api.subscriptions.getSubscriptions, { clerkId: userId });
  const { settings } = useUserSettings();
  const { formatAmount, convertAmount, isLoading: currencyLoading } = useCurrency();

  if (!subscriptions) {
    return (
      <div className="bg-primary rounded-[20px] p-6 shadow-lg animate-pulse">
        <div className="flex">
          <div className="flex-1 text-center">
            <div className="h-4 bg-primary-foreground/20 rounded w-16 mx-auto mb-3" />
            <div className="h-8 bg-primary-foreground/20 rounded w-24 mx-auto" />
          </div>
          <div className="w-px bg-primary-foreground/20 mx-4" />
          <div className="flex-1 text-center">
            <div className="h-4 bg-primary-foreground/20 rounded w-16 mx-auto mb-3" />
            <div className="h-8 bg-primary-foreground/20 rounded w-24 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter(sub => sub.status === "active");

  // Calculate totals with currency conversion
  const monthlyTotal = activeSubscriptions.reduce((sum, sub) => {
    const convertedCost = convertAmount(sub.cost, sub.currency);
    if (sub.billingCycle === "monthly") {
      return sum + convertedCost;
    } else if (sub.billingCycle === "yearly") {
      return sum + convertedCost / 12;
    } else if (sub.billingCycle === "weekly") {
      return sum + convertedCost * 4.33;
    }
    return sum;
  }, 0);

  const yearlyTotal = monthlyTotal * 12;

  // Budget tracking
  const budget = settings?.monthlyBudget || 0;
  const budgetUsage = budget > 0 ? (monthlyTotal / budget) * 100 : 0;
  const isOverBudget = budget > 0 && monthlyTotal > budget;

  return (
    <div className="space-y-4">
      {/* Main Totals Card - Dark like mobile app */}
      <div className="bg-primary rounded-[20px] p-6 shadow-lg">
        <div className="flex">
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-primary-foreground/70 mb-2 tracking-wide">Monthly</p>
            <p className="text-3xl font-bold text-primary-foreground">
              {currencyLoading ? "..." : formatAmount(monthlyTotal)}
            </p>
          </div>
          <div className="w-px bg-primary-foreground/20 mx-4" />
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-primary-foreground/70 mb-2 tracking-wide">Yearly</p>
            <p className="text-3xl font-bold text-primary-foreground">
              {currencyLoading ? "..." : formatAmount(yearlyTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Budget Card - Only show if budget is set */}
      {budget > 0 && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-muted-foreground">Monthly Budget</span>
            <span className={`text-sm font-bold ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
              {formatAmount(monthlyTotal)} / {formatAmount(budget)}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-destructive' : 'bg-success'}`}
              style={{ width: `${Math.min(budgetUsage, 100)}%` }}
            />
          </div>
          {isOverBudget && (
            <p className="text-xs text-destructive mt-2 font-medium">
              Over budget by {formatAmount(monthlyTotal - budget)}
            </p>
          )}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeSubscriptions.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatAmount(monthlyTotal / Math.max(activeSubscriptions.length, 1))}</p>
              <p className="text-xs text-muted-foreground">Avg/sub</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
