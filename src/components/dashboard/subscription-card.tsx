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

          {/* Actions Dropdown (Mobile & Desktop) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${isMobile ? "" : "opacity-0 group-hover:opacity-100 transition-opacity"}`}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="font-sans">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Automate Tier Actions (if applicable) */}
              {isAutomate && (
                <>
                  <Link href={`/dashboard/insights?sub=${subscription._id}`}>
                    <DropdownMenuItem className="font-sans">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      View Insights
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem
                    className="font-sans"
                    onSelect={handleExportToCalendar}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Export to Calendar
                  </DropdownMenuItem>
                  {cancellationPlaybook?.cancellationUrl && (
                    <DropdownMenuItem
                      className="font-sans"
                      onSelect={(event) => {
                        event.preventDefault();
                        window.open(cancellationPlaybook.cancellationUrl, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Manage on {cancellationPlaybook.service}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="font-sans"
                    onSelect={() => setShowCancelDialog(true)}
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Need cancellation help
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Standard Actions */}
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

      {/* Cancel Assistant Modal */}
      <CancelAssistantModal
        subscription={subscription}
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
      />
    </>
  );
}