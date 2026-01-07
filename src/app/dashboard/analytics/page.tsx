import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PremiumFeatureGate } from "@/components/dashboard/premium-feature-gate";
import { AnalyticsDashboard } from "@/components/dashboard/analytics/analytics-dashboard";
import { AnalyticsPremiumFallback } from "@/components/dashboard/analytics/analytics-premium-fallback";

export default async function AnalyticsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Header - Mobile app style */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Insights into your subscription spending.
        </p>
      </div>

      <PremiumFeatureGate fallback={<AnalyticsPremiumFallback />}>
        <AnalyticsDashboard userId={userId} />
      </PremiumFeatureGate>
    </div>
  );
}
