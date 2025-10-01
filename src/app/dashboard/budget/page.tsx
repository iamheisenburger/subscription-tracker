import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { EnhancedSpendingSettings } from "@/components/dashboard/enhanced-spending-settings";
import { BudgetPremiumGate } from "@/components/dashboard/budget-premium-gate";

export default async function BudgetPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Budget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-sans">
            Budget Management
          </h1>
          <p className="text-muted-foreground font-sans">
            Monitor and control your subscription spending with smart insights
          </p>
        </div>
      </div>

      {/* Premium Gate or Enhanced Spending Management */}
      <BudgetPremiumGate>
        <EnhancedSpendingSettings />
      </BudgetPremiumGate>
    </div>
  );
}
