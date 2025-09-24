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
import { MoreHorizontal, Edit, Trash2, Pause, Play } from "lucide-react";
import { Id, Doc } from "../../../convex/_generated/dataModel";
import { EditSubscriptionDialog } from "./edit-subscription-dialog";

interface SubscriptionCardActionsProps {
  subscription: Doc<"subscriptions">;
}

export function SubscriptionCardActions({ 
  subscription 
}: SubscriptionCardActionsProps) {
  const { user } = useUser();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
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
    if (!user?.id) return;

    try {
      await toggleStatus({
        clerkId: user.id,
        subscriptionId: subscription._id as Id<"subscriptions">,
        isActive: !subscription.isActive,
      });
      toast.success(subscription.isActive ? "Subscription paused" : "Subscription resumed");
    } catch (error) {
      console.error("Error toggling subscription:", error);
      toast.error("Failed to update subscription status.");
    }

  };

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
          <DropdownMenuItem onClick={handleTogglePause} className="font-sans">
            {subscription.isActive ? (
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
              Are you sure you want to delete "{subscription.name}"? This action cannot be undone.
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