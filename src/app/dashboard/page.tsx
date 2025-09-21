import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { RecentSubscriptions } from "@/components/dashboard/recent-subscriptions";
import { UpcomingRenewals } from "@/components/dashboard/upcoming-renewals";
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner";

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-sans">
          Welcome back, {user?.firstName || "there"}!
        </h1>
        <p className="text-muted-foreground font-sans">
          Here&apos;s your subscription overview
        </p>
      </div>

      {/* Upgrade Banner */}
      <UpgradeBanner />

      {/* Stats Overview */}
      <OverviewCards userId={userId} />

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