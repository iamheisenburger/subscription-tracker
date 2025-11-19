import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SettingsTabs } from "@/components/dashboard/settings/settings-tabs";

export default async function SettingsPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  const safeUser = user
    ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        emailAddresses: user.emailAddresses?.map((e) => ({ emailAddress: e.emailAddress })) ?? [],
        createdAt: user.createdAt,
      }
    : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-sans tracking-tight">Settings</h1>
          <p className="text-muted-foreground font-sans">
            Manage your account preferences and subscription settings.
          </p>
        </div>
      </div>

      <SettingsTabs user={safeUser} userId={userId} />
    </div>
  );
}