import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AnalyticsHeader } from "@/components/dashboard/analytics/analytics-header";
import { PremiumFeatureGate } from "@/components/dashboard/premium-feature-gate";
import { AnalyticsDashboard } from "@/components/dashboard/analytics/analytics-dashboard";

export default async function AnalyticsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <PremiumFeatureGate
      fallback={
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Premium Feature</h2>
          <p className="text-muted-foreground mb-6">
            Advanced analytics and spending trends are available with Premium.
          </p>
          <a href="/pricing" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg">
            Upgrade to Premium
          </a>
        </div>
      }
    >
      <div className="space-y-8">
        <AnalyticsHeader />
        <AnalyticsDashboard userId={userId} />
      </div>
    </PremiumFeatureGate>
  );
}