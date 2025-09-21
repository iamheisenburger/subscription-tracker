import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TierGate } from "@/components/dashboard/tier-gate";
import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard";

export default async function AnalyticsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Deep insights into your subscription spending patterns
        </p>
      </div>

      {/* Premium Gated Content */}
      <TierGate requiredTier="premium_user">
        <AnalyticsDashboard userId={userId} />
      </TierGate>
    </div>
  );
}
