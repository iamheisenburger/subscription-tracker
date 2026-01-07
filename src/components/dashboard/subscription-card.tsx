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
  AlertCircle,
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
import { differenceInDays } from "date-fns";

// Mobile app category colors - matching exactly
const CATEGORY_COLORS: Record<string, string> = {
  streaming: '#E63946',
  music: '#F77F00',
  productivity: '#06A77D',
  fitness: '#2A9D8F',
  gaming: '#7209B7',
  news: '#457B9D',
  cloud: '#3A86FF',
  other: '#6C757D',
};

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

  // Calculate days until renewal for urgency styling
  const daysUntilRenewal = differenceInDays(subscription.nextBillingDate, new Date());
  const isUrgent = daysUntilRenewal <= 3 && daysUntilRenewal >= 0;
  const isSoon = daysUntilRenewal <= 7 && daysUntilRenewal > 3;

  // Get category color
  const categoryColor = subscription.category
    ? CATEGORY_COLORS[subscription.category.toLowerCase()] || CATEGORY_COLORS.other
    : CATEGORY_COLORS.other;

  return (
    <>
      <div
        className="group flex items-center justify-between p-4 bg-card rounded-2xl border border-border hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={() => setShowEditDialog(true)}
      >
        <div className="flex items-center space-x-4">
          {/* Category color dot indicator */}
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: categoryColor }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base truncate text-foreground">{subscription.name}</h3>
              {!displayActive && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground border-muted-foreground/30">
                  Paused
                </Badge>
              )}
            </div>

            {/* Renewal date with calendar icon - mobile app style */}
            <div className="flex items-center gap-1.5 mt-1">
              <Calendar className={`h-3 w-3 ${isUrgent ? 'text-red-500' : isSoon ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <span className={`text-xs font-medium ${isUrgent ? 'text-red-500' : isSoon ? 'text-amber-500' : 'text-muted-foreground'}`}>
                {isUrgent ? `${daysUntilRenewal === 0 ? 'Today' : `${daysUntilRenewal}d`}` : format(subscription.nextBillingDate, "MMM dd")}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground capitalize">{subscription.billingCycle}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Cost */}
          <div className="text-right">
            <div className="font-bold text-base text-foreground">
              {formattedCost}
            </div>
          </div>

          {/* Actions Dropdown */}
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
