"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Pause, Play, Calendar } from "lucide-react";
import { Id, Doc } from "../../../convex/_generated/dataModel";
import { EditSubscriptionDialog } from "./edit-subscription-dialog";
import { exportSubscriptionToCalendar } from "@/lib/calendar-export";

interface SubscriptionCardActionsProps {
  subscription: Doc<"subscriptions">;
}

export function SubscriptionCardActions({ 
  subscription 
}: SubscriptionCardActionsProps) {
  const { user } = useUser();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [optimisticActive, setOptimisticActive] = useState<boolean | null>(null);
  
  const deleteSubscription = useMutation(api.subscriptions.deleteSubscription);
  const toggleStatus = useMutation(api.subscriptions.toggleSubscriptionStatus);

  const handleDelete = async () => {
    if (!user?.id) return;

    try {
      await deleteSubscription({
        clerkId: user.id,
        subscriptionId: subscription._id as Id<"subscriptions">,
      });
      toast.success("Subscription deleted successfully!");
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast.error("Failed to delete subscription. Please try again.");
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
      setTimeout(() => setOptimisticActive(null), 100);
    }
  };

  const handleExportToCalendar = () => {
    try {
      exportSubscriptionToCalendar(subscription);
      toast.success("Calendar event exported! Check your downloads.");
    } catch (error) {
      console.error("Error exporting to calendar:", error);
      toast.error("Failed to export calendar event.");
    }
  };

  const displayActive = optimisticActive !== null ? optimisticActive : subscription.isActive;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="font-sans">Actions</DropdownMenuLabel>
          <EditSubscriptionDialog subscription={subscription}>
            <DropdownMenuItem
              className="font-sans"
              onSelect={(e) => {
                // Prevent Radix DropdownMenu from auto-closing before dialog opens
                e.preventDefault();
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Subscription
            </DropdownMenuItem>
          </EditSubscriptionDialog>
          <DropdownMenuItem onClick={handleTogglePause} className="font-sans" disabled={isToggling}>
            {displayActive ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause Subscription
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume Subscription
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportToCalendar} className="font-sans">
            <Calendar className="mr-2 h-4 w-4" />
            Export to Calendar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive font-sans"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Subscription
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">Delete Subscription</AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              Are you sure you want to delete <strong>{subscription.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-sans">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="font-sans">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}