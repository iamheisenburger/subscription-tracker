import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { EnhancedSpendingSettings } from "@/components/dashboard/enhanced-spending-settings";
import { BudgetPremiumGate } from "@/components/dashboard/budget-premium-gate";

export default async function BudgetPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Header - Mobile app style */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Budget</h1>
        <p className="text-muted-foreground text-sm">
          Monitor and control your subscription spending.
        </p>
      </div>

      {/* Premium Gate or Enhanced Spending Management */}
      <BudgetPremiumGate>
        <EnhancedSpendingSettings />
      </BudgetPremiumGate>
    </div>
  );
}
