import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SettingsHeader } from "@/components/dashboard/settings/settings-header";
import { AccountSettings } from "@/components/dashboard/settings/account-settings";
import { PreferencesSettings } from "@/components/dashboard/settings/preferences-settings";
import { BillingSettings } from "@/components/dashboard/settings/billing-settings";
import { DangerZone } from "@/components/dashboard/settings/danger-zone";
import { ErrorBoundary } from "@/components/error-boundary";

export default async function SettingsPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-8">
      <SettingsHeader />
      
      <div className="grid gap-8">
        <ErrorBoundary>
          <AccountSettings user={user} />
        </ErrorBoundary>
        <ErrorBoundary>
          <PreferencesSettings userId={userId} />
        </ErrorBoundary>
        <ErrorBoundary>
          <BillingSettings userId={userId} />
        </ErrorBoundary>
        <ErrorBoundary>
          <DangerZone userId={userId} />
        </ErrorBoundary>
      </div>
    </div>
  );
}