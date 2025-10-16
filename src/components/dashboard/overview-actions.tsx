"use client";

import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";
import { useUserTier } from "@/hooks/use-user-tier";
import { AddSubscriptionDialog } from "./add-subscription-dialog";
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
  const { tier } = useUserTier();
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

  const isAutomate = tier === "automate_1";
  const isPlus = tier === "plus" || tier === "premium_user";
  const isFree = tier === "free_user";

  // Free tier: Disabled add button with upgrade tooltip
  if (isFree) {
    return (
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button disabled className="font-sans opacity-50 cursor-not-allowed">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subscription
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upgrade to Plus to add unlimited subscriptions</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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

  // Automate tier: Different UI based on bank connection status
  if (isAutomate) {
    // For Automate users: ALWAYS show Add Manual (outline) + Export
    // Banner handles primary "Connect Bank" CTA for users with no banks
    return (
      <div className="flex items-center gap-2">
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
