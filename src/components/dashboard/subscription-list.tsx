"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, DollarSign, Calendar, CreditCard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddSubscriptionDialog } from "./add-subscription-dialog";
import { EditSubscriptionDialog } from "./edit-subscription-dialog";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface SubscriptionListProps {
  userId: string;
}


export function SubscriptionList({ }: SubscriptionListProps) {
  const { user } = useUser();
  const subscriptions = useQuery(
    api.subscriptions.getUserSubscriptions,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const deleteSubscription = useMutation(api.subscriptions.deleteSubscription);

  const handleDelete = async (subscriptionId: string) => {
    if (!user?.id) {
      toast.error("You must be signed in to delete subscriptions");
      return;
    }

    try {
      await deleteSubscription({
        subscriptionId: subscriptionId as Id<"subscriptions">,
        clerkId: user.id,
      });
      toast.success("Subscription deleted successfully!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage || "Failed to delete subscription");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getBillingCycleColor = (cycle: string) => {
    switch (cycle) {
      case "monthly":
        return "bg-blue-100 text-blue-800";
      case "yearly":
        return "bg-green-100 text-green-800";
      case "weekly":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (subscriptions === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Subscriptions</CardTitle>
          <CardDescription>Manage all your active subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Subscriptions</CardTitle>
          <CardDescription>Manage all your active subscriptions</CardDescription>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No subscriptions yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start tracking your subscriptions to get insights into your spending.
            </p>
            <AddSubscriptionDialog 
              trigger={<Button>Add Your First Subscription</Button>}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Subscriptions</CardTitle>
        <CardDescription>Manage all your active subscriptions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <div
              key={subscription._id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {subscription.name}
                  </h3>
                  <Badge
                    className={getBillingCycleColor(subscription.billingCycle)}
                    variant="secondary"
                  >
                    {subscription.billingCycle}
                  </Badge>
                  {subscription.category && (
                    <Badge variant="outline">{subscription.category}</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {subscription.currency} {subscription.cost}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Next billing: {formatDate(subscription.nextBillingDate)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    ${subscription.cost}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {subscription.billingCycle}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <EditSubscriptionDialog
                      subscription={subscription}
                      trigger={
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      }
                    />
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => handleDelete(subscription._id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
