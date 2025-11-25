"use client";

import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { convertMultipleCurrencies, formatCurrency, getPreferredCurrency } from "@/lib/currency";
import { useEffect, useMemo, useState } from "react";

export function SavingsCelebration() {
  const { user } = useUser();
  
  const subscriptions = useQuery(api.subscriptions.getUserSubscriptions, user?.id ? { clerkId: user.id } : "skip");

  // Calculate savings from cancelled subscriptions with currency conversion
  const cancelledSubscriptions = useMemo(
    () => subscriptions?.filter((sub) => !sub.isActive) || [],
    [subscriptions]
  );

  // Determine preferred currency (localStorage wins to match rest of app)
  const preferredCurrency = typeof window !== 'undefined' ? getPreferredCurrency() : 'USD';

  const [monthlySavings, setMonthlySavings] = useState<number>(0);

  useEffect(() => {
    const run = async () => {
      if (!cancelledSubscriptions.length) {
        setMonthlySavings(0);
        return;
      }
      const monthlyAmounts = cancelledSubscriptions.map(sub => {
        let monthly = sub.cost;
        if (sub.billingCycle === "yearly") monthly = sub.cost / 12;
        else if (sub.billingCycle === "weekly") monthly = sub.cost * 4.33;
        return { amount: monthly, currency: sub.currency || 'USD' };
      });
      const results = await convertMultipleCurrencies(monthlyAmounts, preferredCurrency);
      const total = results.reduce((sum, r) => sum + r.convertedAmount, 0);
      setMonthlySavings(Math.round(total * 100) / 100);
    };
    run();
  }, [cancelledSubscriptions, preferredCurrency]);

  if (!cancelledSubscriptions.length) {
    return null; // Don't show if no cancelled subscriptions
  }

  // If we have subscriptions, compute formatted strings using preferred currency
  const formattedMonthly = formatCurrency(monthlySavings, preferredCurrency);
  const formattedYearly = formatCurrency(monthlySavings * 12, preferredCurrency);

  return (
    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
            <span className="text-lg">💰</span>
          </div>
          <div>
            <h4 className="font-semibold text-green-700 text-sm">
              You&apos;re saving {formattedMonthly}/month
            </h4>
            <p className="text-xs text-green-600/80">
              {formattedYearly}/year from {cancelledSubscriptions.length} cancelled subscription{cancelledSubscriptions.length > 1 ? 's' : ''}
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
