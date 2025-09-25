import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { RecentSubscriptions } from "@/components/dashboard/recent-subscriptions";
import { UpcomingRenewals } from "@/components/dashboard/upcoming-renewals";
import { RenewalConfirmationSystem } from "@/components/dashboard/renewal-confirmation-system";
import { SavingsCelebration } from "@/components/dashboard/savings-celebration";
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner";
import { OverviewActions } from "@/components/dashboard/overview-actions";
import { MobileAnnualCTA } from "@/components/dashboard/mobile-annual-cta";

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

      {/* Renewal Confirmation System */}
      <RenewalConfirmationSystem />

      {/* Savings Celebration */}
      <SavingsCelebration />

      {/* Upgrade Banner */}
      <UpgradeBanner />

      {/* Stats Overview */}
      <OverviewCards userId={userId} />

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