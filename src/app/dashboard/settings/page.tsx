import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SettingsHeader } from "@/components/dashboard/settings/settings-header";
import { SettingsTabs } from "@/components/dashboard/settings/settings-tabs";

export default async function SettingsPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-8">
      <SettingsHeader />
      <SettingsTabs user={user} userId={userId} />
    </div>
  );
}