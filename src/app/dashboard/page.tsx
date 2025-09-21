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
    <>
      <DashboardHeader firstName={user?.firstName || null} />
      
      <div className="space-y-6">
        <UpgradeBanner />
        
        <SubscriptionStats userId={userId} />
        
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SubscriptionList userId={userId} />
          </div>
          <div>
            <UpcomingRenewals userId={userId} />
          </div>
        </div>
      </div>
    </>
  );
}