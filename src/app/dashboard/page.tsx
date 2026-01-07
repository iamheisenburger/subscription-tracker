import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AutoTierSync } from "@/components/dashboard/auto-tier-sync";
import { GmailConnectionToast } from "@/components/dashboard/gmail-connection-toast";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <>
      {/* Background utilities */}
      <AutoTierSync />
      <GmailConnectionToast />

      {/* Main Dashboard Content - Mobile style */}
      <DashboardContent 
        userId={userId} 
        userName={user?.firstName || "there"} 
      />
    </>
  );
}
