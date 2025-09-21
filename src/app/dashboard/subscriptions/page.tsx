import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SubscriptionsTable } from "@/components/dashboard/subscriptions/subscriptions-table";
import { SubscriptionsHeader } from "@/components/dashboard/subscriptions/subscriptions-header";

export default async function SubscriptionsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <SubscriptionsHeader />
      <SubscriptionsTable userId={userId} />
    </div>
  );
}