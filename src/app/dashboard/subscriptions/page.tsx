import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SubscriptionList } from "@/components/dashboard/subscription-list";
import { AddSubscriptionDialog } from "@/components/dashboard/add-subscription-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function SubscriptionsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage all your active subscriptions in one place
          </p>
        </div>
        
        {/* Add Subscription Button - Desktop */}
        <div className="hidden md:block">
          <AddSubscriptionDialog 
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Subscription
              </Button>
            }
          />
        </div>
      </div>

      {/* Subscription List */}
      <SubscriptionList userId={userId} />
      
      {/* Floating Action Button - Mobile */}
      <div className="fixed bottom-20 right-4 md:hidden">
        <AddSubscriptionDialog 
          trigger={
            <Button size="lg" className="h-14 w-14 rounded-full shadow-lg">
              <Plus className="h-6 w-6" />
            </Button>
          }
        />
      </div>
    </div>
  );
}
