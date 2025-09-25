import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AnalyticsHeader } from "@/components/dashboard/analytics/analytics-header";
import { PremiumFeatureGate } from "@/components/dashboard/premium-feature-gate";
import { AnalyticsDashboard } from "@/components/dashboard/analytics/analytics-dashboard";
import { AnalyticsPremiumFallback } from "@/components/dashboard/analytics/analytics-premium-fallback";

export default async function AnalyticsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <PremiumFeatureGate fallback={<AnalyticsPremiumFallback />}>
      <div className="space-y-8">
        <AnalyticsHeader />
        <AnalyticsDashboard userId={userId} />
      </div>
    </PremiumFeatureGate>
  );
}