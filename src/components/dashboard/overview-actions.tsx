"use client";

import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";
import { useUserTier } from "@/hooks/use-user-tier";
import { AddSubscriptionDialog } from "./add-subscription-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function OverviewActions() {
  const { isPremium } = useUserTier();

  return (
    <div className="flex items-center gap-2">
      <AddSubscriptionDialog>
        <Button className="font-sans">
          <Plus className="mr-2 h-4 w-4" />
          Add Subscription
        </Button>
      </AddSubscriptionDialog>
      
      
      {isPremium ? (
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
      ) : null}
    </div>
  );
}
