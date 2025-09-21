import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NotificationSettings } from "@/components/dashboard/notification-settings";
import { NotificationList } from "@/components/dashboard/notification-list";

export default async function NotificationsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          Stay on top of your subscription renewals and updates
        </p>
      </div>

      {/* Notification Settings */}
      <NotificationSettings />

      {/* All Notifications */}
      <NotificationList />
    </div>
  );
}
