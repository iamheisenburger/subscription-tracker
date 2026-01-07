"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Edit,
  Trash2,
  Pause,
  Play,
  MoreVertical,
  Calendar,
  TrendingUp,
  HelpCircle,
  ExternalLink,
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
import { CancelAssistantModal } from "./cancel-assistant-modal";
import { exportSubscriptionToCalendar } from "@/lib/calendar-export";
import Link from "next/link";
import { getPlaybook } from "@/lib/cancel-playbooks";

interface SubscriptionCardProps {
  subscription: Doc<"subscriptions">;
  showCategory?: boolean;
  currency?: string;
  hasDuplicateAlert?: boolean;
}

export function SubscriptionCard({
  subscription,
  showCategory = true,
  currency = "USD",
  hasDuplicateAlert,
}: SubscriptionCardProps) {
  const { user } = useUser();
  const { tier } = useUserTier();
  const isMobile = useIsMobile();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
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

  const handleExportToCalendar = () => {
    try {
      exportSubscriptionToCalendar(subscription);
      toast.success(`${subscription.name} added to calendar!`);
    } catch (error) {
      console.error("Error exporting to calendar:", error);
      toast.error("Failed to export to calendar.");
    }
  };
  
  // Use optimistic state if available, otherwise use real state
  const displayActive = optimisticActive !== null ? optimisticActive : subscription.isActive;

  // Format cost with user's preferred currency
  const resolvedCurrency = currency || subscription.currency || "USD";
  const formattedCost = formatCurrency(subscription.cost, resolvedCurrency);

  const cancellationPlaybook = getPlaybook(subscription.name);

  // Determine which feature badges to show (only for Automate users)
  const isAutomate = tier === "automate_1";
  const isManual = subscription.source === "manual" || !subscription.source;
  const showFeatureBadges =
    isAutomate &&
    (subscription.source === "detected" ||
      subscription.detectionConfidence ||
      subscription.predictedCadence ||
      subscription.predictionConfidence ||
      isManual); // Show price tracking badge for manual entries

  return (
    <>
      <div className="group flex items-center justify-between p-4 bg-muted/20 rounded-xl hover:bg-muted/30 transition-all duration-200">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-primary">
              {subscription.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{subscription.name}</h3>
            <p className="text-xs text-muted-foreground">
              {format(subscription.nextBillingDate, "MMM dd")} • {subscription.billingCycle}
            </p>
            {showCategory && subscription.category && (
              <Badge variant="secondary" className="mt-1 text-xs rounded-md bg-accent/40">
                {subscription.category}
              </Badge>
            )}
            {showFeatureBadges && (
              <FeatureBadgesContainer>
                {/* Auto-detected badge - only for detected subscriptions */}
                {subscription.source === "detected" && (
                  <Link href={`/dashboard/insights?sub=${subscription._id}&tab=activity`}>
                    <FeatureBadge
                      type="auto-detected"
                      confidence={subscription.detectionConfidence}
                      clickable
                    />
                  </Link>
                )}

                {/* Price tracked - show for ALL Automate subscriptions (manual or detected) */}
                {isAutomate && (
                  <Link href={`/dashboard/insights?sub=${subscription._id}&tab=price-history`}>
                    <FeatureBadge type="price-tracked" clickable />
                  </Link>
                )}

                {/* Renewal predicted - show when prediction exists */}
                {subscription.predictedCadence && subscription.predictionConfidence && (
                  <Link href={`/dashboard/insights?tab=predictions`}>
                    <FeatureBadge
                      type="renewal-predicted"
                      confidence={subscription.predictionConfidence}
                      clickable
                    />
                  </Link>
                )}

                {/* Duplicate protection - only when we have an unread duplicate alert for this subscription */}
                {isAutomate && hasDuplicateAlert && (
                  <Link href={`/dashboard/insights?tab=alerts&sub=${subscription._id}`}>
                    <FeatureBadge type="duplicate-alert" clickable />
                  </Link>
                )}
              </FeatureBadgesContainer>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-semibold text-sm">
              {formattedCost}
            </div>
            <Badge 
              className={`text-xs rounded-md ${
                displayActive 
                  ? 'bg-success/10 text-success border-success/30' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {displayActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Actions Dropdown (Mobile & Desktop) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-lg ${isMobile ? "" : "opacity-0 group-hover:opacity-100 transition-opacity"}`}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Automate Tier Actions (if applicable) */}
              {isAutomate && (
                <>
                  <Link href={`/dashboard/insights?sub=${subscription._id}`}>
                    <DropdownMenuItem>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      View Insights
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onSelect={handleExportToCalendar}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Export to Calendar
                  </DropdownMenuItem>
                  {cancellationPlaybook?.cancellationUrl && (
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        window.open(cancellationPlaybook.cancellationUrl, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Manage on {cancellationPlaybook.service}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => setShowCancelDialog(true)}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Need cancellation help
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Standard Actions */}
              <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
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
                className="text-destructive"
                onSelect={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{subscription.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

      {/* Cancel Assistant Modal */}
      <CancelAssistantModal
        subscription={subscription}
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
      />
    </>
  );
}
