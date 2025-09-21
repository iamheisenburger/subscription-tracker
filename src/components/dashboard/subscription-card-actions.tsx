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
import { Id } from "../../../convex/_generated/dataModel";

interface SubscriptionCardActionsProps {
  subscriptionId: string;
  subscriptionName: string;
  isActive: boolean;
}

export function SubscriptionCardActions({ 
  subscriptionId, 
  subscriptionName, 
  isActive 
}: SubscriptionCardActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { user } = useUser();
  const deleteSubscription = useMutation(api.subscriptions.deleteSubscription);

  const handleDelete = async () => {
    if (!user?.id) return;

    try {
      await deleteSubscription({
        clerkId: user.id,
        subscriptionId: subscriptionId as Id<"subscriptions">
      });
      toast.success(`${subscriptionName} deleted successfully!`);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast.error("Failed to delete subscription. Please try again.");
    }
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    toast.info("Edit functionality coming soon!");
  };

  const handleTogglePause = () => {
    // TODO: Implement pause/resume functionality
    toast.info(`${isActive ? 'Pause' : 'Resume'} functionality coming soon!`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="font-sans">Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleEdit} className="font-sans">
            <Edit className="mr-2 h-4 w-4" />
            Edit Subscription
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleTogglePause} className="font-sans">
            {isActive ? (
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
              Are you sure you want to delete <strong>{subscriptionName}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-sans">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-sans"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
