import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { RecentSubscriptions } from "@/components/dashboard/recent-subscriptions";
import { UpcomingRenewals } from "@/components/dashboard/upcoming-renewals";
import { RenewalConfirmationSystem } from "@/components/dashboard/renewal-confirmation-system";
import { SavingsCelebration } from "@/components/dashboard/savings-celebration";
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner";
import { BankConnectionCTACard } from "@/components/dashboard/bank-connection-cta-card";
import { AutomateDetectionQueue } from "@/components/dashboard/automate/automate-detection-queue";
import { ConnectedBanksWidget } from "@/components/dashboard/automate/connected-banks-widget";
import { FeaturePreviewCards } from "@/components/dashboard/automate/feature-preview-cards";
import { OverviewActions } from "@/components/dashboard/overview-actions";
import { MobileAnnualCTA } from "@/components/dashboard/mobile-annual-cta";
import { AutoTierSync } from "@/components/dashboard/auto-tier-sync";

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-sans">
            Welcome back, {user?.firstName || "there"}!
          </h1>
          <p className="text-muted-foreground font-sans">
            Here&apos;s your subscription overview
          </p>
        </div>
        <OverviewActions />
      </div>

      {/* Auto Tier Sync - Silent reconciliation */}
      <AutoTierSync />

      {/* Renewal Confirmation System */}
      <RenewalConfirmationSystem />

      {/* Automate-specific: Detection Queue (shows pending detections) */}
      <AutomateDetectionQueue />

      {/* Conditional CTAs based on tier and bank status */}
      {/* BankConnectionCTACard for Automate users with no banks */}
      {/* UpgradeBanner for Free/Plus users */}
      <UpgradeBanner />
      <BankConnectionCTACard />

      {/* Feature Preview: Show what Automate users will unlock after connecting bank */}
      <FeaturePreviewCards />

      {/* Savings Celebration */}
      <SavingsCelebration />

      {/* Stats Overview */}
      <OverviewCards userId={userId} />

      {/* Automate-specific: Connected Banks Widget (shows bank status) */}
      <ConnectedBanksWidget />

      {/* Mobile Annual Upgrade CTA */}
      <MobileAnnualCTA />

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentSubscriptions userId={userId} />
        </div>
        <div>
          <UpcomingRenewals userId={userId} />
        </div>
      </div>
    </div>
  );
}