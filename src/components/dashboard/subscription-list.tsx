"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface SubscriptionListProps {
  userId: string;
}

export function SubscriptionList({ userId }: SubscriptionListProps) {
  const subscriptions = useQuery(api.subscriptions.getUserSubscriptions, { 
    clerkId: userId 
  });
  const deleteSubscription = useMutation(api.subscriptions.deleteSubscription);

  const handleDelete = async (subscriptionId: Id<"subscriptions">) => {
    try {
      await deleteSubscription({ clerkId: userId, subscriptionId });
      toast.success("Subscription deleted successfully");
    } catch {
      toast.error("Failed to delete subscription");
    }
  };

  if (!subscriptions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-muted rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
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
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No subscriptions yet. Add your first subscription to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Subscriptions</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage all your active subscriptions
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <div
              key={subscription._id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-semibold text-lg">
                    {subscription.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{subscription.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>${subscription.cost.toFixed(2)}</span>
                    <span>•</span>
                    <Badge variant="secondary" className="text-xs">
                      {subscription.billingCycle}
                    </Badge>
                    {subscription.category && (
                      <>
                        <span>•</span>
                        <span>{subscription.category}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-right text-sm">
                  <p className="font-medium">
                    Next: {new Date(subscription.nextBillingDate).toLocaleDateString()}
                  </p>
                  <p className="text-muted-foreground">
                    {Math.ceil((subscription.nextBillingDate - Date.now()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(subscription._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
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