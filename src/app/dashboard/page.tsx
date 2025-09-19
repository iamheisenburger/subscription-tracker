import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SubscriptionStats } from "@/components/dashboard/subscription-stats";
import { SubscriptionList } from "@/components/dashboard/subscription-list";
import { UpcomingRenewals } from "@/components/dashboard/upcoming-renewals";
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner";

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <DashboardHeader firstName={user?.firstName ?? null} />

      {/* Main Content */}
      <main className="flex-1 space-y-4 p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Mobile Welcome Message */}
          <div className="md:hidden">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {user?.firstName || "there"}!
            </h1>
            <p className="text-muted-foreground">
              Track your subscriptions and spending
            </p>
          </div>

          {/* Upgrade Banner */}
          <UpgradeBanner />

          {/* Stats Overview */}
          <SubscriptionStats userId={userId} />
          
          {/* Two Column Layout */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Subscriptions List */}
            <div className="lg:col-span-2">
              <SubscriptionList userId={userId} />
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              <UpcomingRenewals userId={userId} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
