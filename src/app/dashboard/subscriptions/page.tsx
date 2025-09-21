import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SubscriptionDataTable } from "@/components/dashboard/subscription-data-table";

export default async function SubscriptionsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage all your subscriptions in one place
          </p>
        </div>
      </div>

      <SubscriptionDataTable userId={userId} />
    </div>
  );
}
