"use client";

import { Button } from "@/components/ui/button";
import { Download, Plus, Building2 } from "lucide-react";
import { useUserTier } from "@/hooks/use-user-tier";
import { useBankConnections } from "@/hooks/use-bank-connections";
import { AddSubscriptionDialog } from "./add-subscription-dialog";
import { PlaidLinkButton } from "./bank/plaid-link-button";
import Link from "next/link";
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
  const { isPremium, tier } = useUserTier();
  const { activeConnectionsCount, isLoading } = useBankConnections();

  const isAutomate = tier === "automate_1";
  const isPlus = tier === "plus" || tier === "premium_user";
  const isFree = tier === "free_user";
  const hasBankConnected = activeConnectionsCount > 0;

  const handleBankSuccess = () => {
    window.location.reload();
  };

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
    // No bank connected: Primary = Connect Bank, Secondary = Add Manual
    if (!hasBankConnected && !isLoading) {
      return (
        <div className="flex items-center gap-2">
          <PlaidLinkButton onSuccess={handleBankSuccess}>
            <Button className="font-sans">
              <Building2 className="mr-2 h-4 w-4" />
              Connect Bank
            </Button>
          </PlaidLinkButton>

          <AddSubscriptionDialog>
            <Button variant="ghost" className="font-sans">
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

    // Bank connected: Add Manual as secondary action + Export
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
