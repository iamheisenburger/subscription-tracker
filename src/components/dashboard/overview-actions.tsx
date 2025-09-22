"use client";

import { Button } from "@/components/ui/button";
import { Download, Plus, RefreshCw } from "lucide-react";
import { useUserTier } from "@/hooks/use-user-tier";
import { AddSubscriptionDialog } from "./add-subscription-dialog";
import { useState } from "react";
import { toast } from "sonner";
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
  const [isDebugging, setIsDebugging] = useState(false);

  const handleDebugSync = async () => {
    setIsDebugging(true);
    try {
      const response = await fetch('/api/debug/sync-tier', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Tier synced: ${result.tier}`);
        console.log('Debug sync result:', result);
        // Refresh page to show updated tier
        window.location.reload();
      } else {
        toast.error(`Sync failed: ${result.error}`);
        console.error('Debug sync failed:', result);
      }
    } catch (error) {
      toast.error('Sync failed');
      console.error('Debug sync error:', error);
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <AddSubscriptionDialog>
        <Button className="font-sans">
          <Plus className="mr-2 h-4 w-4" />
          Add Subscription
        </Button>
      </AddSubscriptionDialog>
      
      {/* Debug button - remove after testing */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleDebugSync}
        disabled={isDebugging}
        className="font-sans"
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isDebugging ? 'animate-spin' : ''}`} />
        Debug Sync
      </Button>
      
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
