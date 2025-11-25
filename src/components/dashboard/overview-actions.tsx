"use client";

import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";
import { useUserTier } from "@/hooks/use-user-tier";
import { AddSubscriptionDialog } from "./add-subscription-dialog";
import { NotificationsBell } from "./notifications-bell";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { exportAllSubscriptionsToCalendar } from "@/lib/calendar-export";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function OverviewActions() {
  const { isPlus, isAutomate, isFree } = useUserTier();
  const { user } = useUser();

  // Fetch active subscriptions for calendar export
  const subscriptions = useQuery(
    api.subscriptions.getUserSubscriptions,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const handleExportAllToCalendar = () => {
    if (!subscriptions || subscriptions.length === 0) {
      toast.error("No subscriptions to export");
      return;
    }

    try {
      exportAllSubscriptionsToCalendar(subscriptions);
      toast.success("Calendar events exported! Check your downloads.");
    } catch (error) {
      console.error("Error exporting to calendar:", error);
      toast.error("Failed to export calendar events.");
    }
  };

  // Free tier: Allow manual tracking up to the limit
  if (isFree) {
    const freeLimit = 3;
    const currentCount = subscriptions?.length ?? 0;
    const reachedLimit = currentCount >= freeLimit;

    return (
      <div className="flex items-center gap-2">
        {reachedLimit ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button disabled className="font-sans opacity-60 cursor-not-allowed">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subscription
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px]">
                <p className="font-sans text-xs">
                  Free plan includes up to {freeLimit} manual subscriptions. Upgrade to Plus for unlimited tracking.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <AddSubscriptionDialog>
            <Button className="font-sans">
              <Plus className="mr-2 h-4 w-4" />
              Add Subscription
            </Button>
          </AddSubscriptionDialog>
        )}
      </div>
    );
  }

  // Plus tier: Add subscription + Export
  if (isPlus) {
    return (
      <div className="flex items-center gap-2">
        <AddSubscriptionDialog>
          <Button className="font-sans">
            <Plus className="mr-2 h-4 w-4" />
            Add Subscription
          </Button>
        </AddSubscriptionDialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="font-sans">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="font-sans">Export Data</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportAllToCalendar} className="font-sans">
              Export to Calendar
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/api/export/csv" className="font-sans">Download CSV</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/api/export/pdf" className="font-sans">Download PDF</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Automate tier: Notification Bell + Add Manual + Export
  if (isAutomate) {
    return (
      <div className="flex items-center gap-2">
        {/* Notification Bell - NEW */}
        <NotificationsBell />

        <AddSubscriptionDialog>
          <Button variant="outline" className="font-sans">
            <Plus className="mr-2 h-4 w-4" />
            Add Manual
          </Button>
        </AddSubscriptionDialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="font-sans">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="font-sans">Export Data</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportAllToCalendar} className="font-sans">
              Calendar (.ics)
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/api/export/csv" className="font-sans">CSV</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/api/export/pdf" className="font-sans">PDF</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Fallback: Default behavior
  return (
    <div className="flex items-center gap-2">
      <AddSubscriptionDialog>
        <Button className="font-sans">
          <Plus className="mr-2 h-4 w-4" />
          Add Subscription
        </Button>
      </AddSubscriptionDialog>
    </div>
  );
}
