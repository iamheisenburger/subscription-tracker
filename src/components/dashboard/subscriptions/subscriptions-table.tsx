"use client";

import { useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Pause, Play, Target } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ConvexErrorBoundary } from "@/components/convex-error-boundary";
import { EditSubscriptionDialog } from "@/components/dashboard/edit-subscription-dialog";
import { SubscriptionCard } from "@/components/dashboard/subscription-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Id } from "../../../../convex/_generated/dataModel";

interface SubscriptionsTableProps {
  userId: string;
  search?: string;
  sortBy?: string;
  billing?: ("monthly"|"yearly"|"weekly")[];
  categories?: string[];
}

export function SubscriptionsTable({ userId, search, sortBy, billing, categories }: SubscriptionsTableProps) {
  return (
    <ConvexErrorBoundary>
      <SubscriptionsTableContent
        userId={userId}
        search={search}
        sortBy={sortBy}
        billing={billing}
        categories={categories}
      />
    </ConvexErrorBoundary>
  );
}

function SubscriptionsTableContent({ userId, search, sortBy = "name", billing, categories }: SubscriptionsTableProps) {
  const isMobile = useIsMobile();

  // PERFORMANCE: Simple query, filter client-side for speed
  const allSubscriptions = useQuery(api.subscriptions.getUserSubscriptions, {
    clerkId: userId,
    activeOnly: false,
  });

  // Notification history for duplicate protection badge gating
  const notifications = useQuery(api.insights.getNotificationHistory, {
    clerkUserId: userId,
    limit: 200,
  });

  // Client-side filtering and sorting
  const subscriptions = useMemo(() => {
    if (!allSubscriptions) return undefined;

    const filtered = allSubscriptions.filter((sub) => {
      // Search filter
      if (search && !sub.name.toLowerCase().includes(search.toLowerCase())) return false;
      
      // Multi-select billing cycle filter
      if (billing && billing.length > 0 && !billing.includes(sub.billingCycle)) return false;
      
      // Multi-select category filter
      if (categories && categories.length > 0 && !categories.includes(sub.category || "other")) return false;
      
      return true;
    });

    // Sort (create new sorted array)
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "cost_high":
          return b.cost - a.cost;
        case "cost_low":
          return a.cost - b.cost;
        case "renewal":
          return a.nextBillingDate - b.nextBillingDate;
        default:
          return 0;
      }
    });

    return sorted;
  }, [allSubscriptions, search, billing, categories, sortBy]);

  // Map of subscriptionId -> has unread duplicate alert
  const duplicateAlertMap = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!notifications) return map;

    notifications.forEach((n) => {
      if (!n.read && typeof n.type === "string" && n.type.includes("duplicate")) {
        const meta = n.metadata as { subscriptionId?: string } | undefined;
        const subId = meta?.subscriptionId;
        if (subId) {
          map.set(subId, true);
        }
      }
    });

    return map;
  }, [notifications]);
  const deleteSubscription = useMutation(api.subscriptions.deleteSubscription);
  const toggleStatus = useMutation(api.subscriptions.toggleSubscriptionStatus);

  const handleDelete = async (subscriptionId: string) => {
    try {
      await deleteSubscription({
        clerkId: userId,
        subscriptionId: subscriptionId as Id<"subscriptions">
      });
      toast.success("Subscription deleted successfully!");
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast.error("Failed to delete subscription. Please try again.");
    }
  };

  if (subscriptions === undefined) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 bg-muted/30 rounded-xl">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-3 w-1/2 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12 px-6">
        <div className="mx-auto w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
          <Target className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No subscriptions found</h3>
        <p className="text-muted-foreground text-sm">
          Start tracking your expenses by adding your first subscription.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {isMobile ? (
        // Mobile Card View with Swipe Gestures
        <div className="space-y-3">
          {subscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription._id}
              subscription={subscription}
              showCategory={true}
              currency="USD" // Will be replaced with user preference later
              hasDuplicateAlert={duplicateAlertMap.get(subscription._id) === true}
            />
          ))}
        </div>
      ) : (
        // Desktop Table View
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Service</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Next Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
              <TableRow key={subscription._id} className="hover:bg-muted/20">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {subscription.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{subscription.name}</p>
                      {subscription.category && (
                        <Badge variant="secondary" className="mt-1 rounded-md text-xs bg-accent/40">
                          {subscription.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-semibold">
                    {subscription.currency} {subscription.cost.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize rounded-lg">
                    {subscription.billingCycle}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {format(subscription.nextBillingDate, "MMM dd, yyyy")}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`rounded-lg ${
                      subscription.isActive 
                        ? 'bg-success/10 text-success border-success/30' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {subscription.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <EditSubscriptionDialog subscription={subscription}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </EditSubscriptionDialog>
                      <DropdownMenuItem
                        onClick={async () => {
                          try {
                            await toggleStatus({
                              clerkId: userId,
                              subscriptionId: subscription._id as Id<"subscriptions">,
                              isActive: !subscription.isActive,
                            });
                            toast.success(subscription.isActive ? "Subscription paused" : "Subscription resumed");
                          } catch {
                            toast.error("Failed to update status");
                          }
                        }}
                      >
                        {subscription.isActive ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Resume
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(subscription._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
