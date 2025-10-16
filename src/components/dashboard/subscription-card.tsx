"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  CreditCard, 
  Edit, 
  Trash2, 
  Pause, 
  Play,
  MoreVertical
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency } from "@/lib/currency";
import { Id, Doc } from "../../../convex/_generated/dataModel";
import { EditSubscriptionDialog } from "./edit-subscription-dialog";
import { FeatureBadge, FeatureBadgesContainer } from "./feature-badge";
import { useUserTier } from "@/hooks/use-user-tier";

interface SubscriptionCardProps {
  subscription: Doc<"subscriptions">;
  showCategory?: boolean;
  currency?: string;
}

export function SubscriptionCard({
  subscription,
  showCategory = true,
  currency = 'USD'
}: SubscriptionCardProps) {
  const { user } = useUser();
  const { tier } = useUserTier();
  const isMobile = useIsMobile();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  // Optimistic UI state
  const [optimisticActive, setOptimisticActive] = useState<boolean | null>(null);
  
  // Mutations
  const deleteSubscription = useMutation(api.subscriptions.deleteSubscription);
  const toggleStatus = useMutation(api.subscriptions.toggleSubscriptionStatus);

  const handleDelete = async () => {
    if (!user?.id) return;
    setIsDeleting(true);
    try {
      await deleteSubscription({
        clerkId: user.id,
        subscriptionId: subscription._id as Id<"subscriptions">,
      });
      toast.success("Subscription deleted successfully!");
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast.error("Failed to delete subscription. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleTogglePause = async () => {
    if (!user?.id || isToggling) return;
    
    const newStatus = !subscription.isActive;
    
    // OPTIMISTIC UPDATE: Change UI immediately
    setOptimisticActive(newStatus);
    setIsToggling(true);
    
    try {
      await toggleStatus({
        clerkId: user.id,
        subscriptionId: subscription._id as Id<"subscriptions">,
        isActive: newStatus,
      });
      toast.success(subscription.isActive ? "Subscription paused" : "Subscription resumed");
    } catch (error) {
      console.error("Error toggling subscription:", error);
      // ROLLBACK on error
      setOptimisticActive(subscription.isActive);
      toast.error("Failed to update subscription status.");
    } finally {
      setIsToggling(false);
      // Clear optimistic state after mutation completes
      setTimeout(() => setOptimisticActive(null), 100);
    }
  };
  
  // Use optimistic state if available, otherwise use real state
  const displayActive = optimisticActive !== null ? optimisticActive : subscription.isActive;

  // Format cost with user's preferred currency
  const formattedCost = formatCurrency(subscription.cost, subscription.currency);

  // Determine which feature badges to show (only for Automate users)
  const isAutomate = tier === "automate_1";
  const showFeatureBadges = isAutomate && (
    subscription.source === "detected" ||
    subscription.detectionConfidence ||
    subscription.predictedCadence ||
    subscription.predictionConfidence
  );

  return (
    <>
      <div className="group flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold font-sans truncate">{subscription.name}</h3>
            <p className="text-sm text-muted-foreground font-sans">
              Next: {format(subscription.nextBillingDate, "MMM dd, yyyy")} • {subscription.billingCycle}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {showCategory && subscription.category && (
                <Badge variant="secondary" className="text-xs font-sans">
                  {subscription.category}
                </Badge>
              )}
            </div>
            {showFeatureBadges && (
              <FeatureBadgesContainer>
                {subscription.source === "detected" && (
                  <FeatureBadge
                    type="auto-detected"
                    confidence={subscription.detectionConfidence}
                  />
                )}
                {isAutomate && subscription.lastChargeAt && (
                  <FeatureBadge type="price-tracked" />
                )}
                {subscription.predictedCadence && subscription.predictionConfidence && (
                  <FeatureBadge
                    type="renewal-predicted"
                    confidence={subscription.predictionConfidence}
                  />
                )}
                {isAutomate && subscription.source === "detected" && (
                  <FeatureBadge type="duplicate-alert" />
                )}
              </FeatureBadgesContainer>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right space-y-1">
            <div className="font-bold font-sans">
              {formattedCost}
            </div>
            <Badge 
              variant={displayActive ? "default" : "secondary"} 
              className="font-sans"
            >
              {displayActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Mobile: Dropdown Menu */}
          {isMobile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-sans">Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="font-sans"
                  onSelect={() => setShowEditDialog(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="font-sans"
                  onSelect={handleTogglePause}
                  disabled={isToggling}
                >
                  {displayActive ? (
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
                  onSelect={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Desktop: Individual Buttons */
            <>
              <EditSubscriptionDialog subscription={subscription}>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              </EditSubscriptionDialog>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleTogglePause}
                disabled={isToggling}
              >
                {displayActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span className="sr-only">{displayActive ? "Pause" : "Resume"}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              Are you sure you want to delete <strong>{subscription.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-sans">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="font-sans bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <EditSubscriptionDialog 
        subscription={subscription} 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
      />
    </>
  );
}