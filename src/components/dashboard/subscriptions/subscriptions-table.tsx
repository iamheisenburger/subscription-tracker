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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  activeFilter?: string;
  categoryFilter?: string;
  billing?: ("monthly"|"yearly"|"weekly")[];
  categories?: string[];
}

export function SubscriptionsTable({ userId, search, activeFilter, categoryFilter, billing, categories }: SubscriptionsTableProps) {
  return (
    <ConvexErrorBoundary>
      <SubscriptionsTableContent
        userId={userId}
        search={search}
        activeFilter={activeFilter}
        categoryFilter={categoryFilter}
        billing={billing}
        categories={categories}
      />
    </ConvexErrorBoundary>
  );
}

interface SubscriptionsTableContentProps extends SubscriptionsTableProps {
  search?: string;
  activeFilter?: string;
  categoryFilter?: string;
}

function SubscriptionsTableContent({ userId, search, activeFilter, categoryFilter, billing, categories }: SubscriptionsTableContentProps) {
  // Parse filters for Convex query
  const isMobile = useIsMobile();
  const billingCycle = ["monthly", "yearly", "weekly"].includes(activeFilter || "") ? activeFilter as "monthly" | "yearly" | "weekly" : undefined;
  const category = categoryFilter && categoryFilter !== "all" ? categoryFilter : undefined;

  // PERFORMANCE: Simple query, filter client-side for speed
  const allSubscriptions = useQuery(api.subscriptions.getUserSubscriptions, {
    clerkId: userId,
    activeOnly: false, // Get all, filter client-side
  });

  // Client-side filtering for better performance
  const subscriptions = useMemo(() => {
    if (!allSubscriptions) return undefined;
    
    return allSubscriptions.filter(sub => {
      // Status filter
      if (activeFilter === "active" && !sub.isActive) return false;
      if (activeFilter === "inactive" && sub.isActive) return false;
      
      // Search filter
      if (search && !sub.name.toLowerCase().includes(search.toLowerCase())) return false;
      
      // Category filter
      if (category && sub.category !== category) return false;
      if (categoryFilter === "uncategorized" && sub.category) return false;
      
      // Billing cycle filter
      if (billingCycle && sub.billingCycle !== billingCycle) return false;
      
      // Multi-select filters
      if (billing && billing.length > 0 && !billing.includes(sub.billingCycle)) return false;
      if (categories && categories.length > 0 && !categories.includes(sub.category || "uncategorized")) return false;
      
      return true;
    });
  }, [allSubscriptions, activeFilter, search, category, categoryFilter, billingCycle, billing, categories]);
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
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-8" />
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
        <CardContent className="text-center py-12">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <Target className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold font-sans mb-2">No subscriptions found</h3>
          <p className="text-muted-foreground font-sans mb-4">
            Start tracking your expenses by adding your first subscription.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans">All Subscriptions</CardTitle>
        <CardDescription className="font-sans">
          {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''} total
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isMobile ? (
          // Mobile Card View with Swipe Gestures
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription._id}
                subscription={subscription}
                showCategory={true}
                currency="USD" // Will be replaced with user preference later
              />
            ))}
          </div>
        ) : (
          // Desktop Table View
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sans">Service</TableHead>
                  <TableHead className="font-sans">Cost</TableHead>
                  <TableHead className="font-sans">Billing</TableHead>
                  <TableHead className="font-sans">Next Payment</TableHead>
                  <TableHead className="font-sans">Status</TableHead>
                  <TableHead className="font-sans w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                <TableRow key={subscription._id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-semibold font-sans">
                          {subscription.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium font-sans">{subscription.name}</p>
                        {subscription.category && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 mt-1 rounded-md text-xs font-medium bg-accent/40 text-accent-foreground"
                          >
                            {subscription.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium font-sans">
                      {subscription.currency} {subscription.cost.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-sans capitalize">
                      {subscription.billingCycle}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-sans">
                      {format(subscription.nextBillingDate, "MMM dd, yyyy")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={subscription.isActive ? "default" : "secondary"}
                      className="font-sans"
                    >
                      {subscription.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel className="font-sans">Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <EditSubscriptionDialog subscription={subscription}>
                          <DropdownMenuItem className="font-sans" onSelect={(e) => e.preventDefault()}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </EditSubscriptionDialog>
                        <DropdownMenuItem
                          className="font-sans"
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
                          className="text-destructive font-sans"
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
      </CardContent>
    </Card>
  );
}