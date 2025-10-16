"use client";

/**
 * Automate Status Badge Component
 * Always-visible header indicator showing Automate tier feature status
 * Adapts based on bank connection state and detection progress
 */

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { useUserTier } from "@/hooks/use-user-tier";
import { useBankConnections } from "@/hooks/use-bank-connections";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export function AutomateStatusBadge() {
  const { tier } = useUserTier();
  const { user } = useUser();
  const { activeConnectionsCount, isLoading: banksLoading } = useBankConnections();

  // Query pending detection candidates
  const candidates = useQuery(
    api.detection.getPendingCandidates,
    user?.id ? { clerkUserId: user.id } : "skip"
  );

  // Only show for Automate tier
  if (tier !== "automate_1") {
    return null;
  }

  // Loading state
  if (banksLoading) {
    return null;
  }

  const hasBanks = activeConnectionsCount > 0;
  const detectionCount = candidates?.length || 0;

  // State 1: No banks connected
  if (!hasBanks) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className="font-sans text-xs bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20"
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              Automate Inactive
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Connect your bank to unlock automation features</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // State 2: Banks connected, analyzing (no detections yet)
  if (hasBanks && detectionCount === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className="font-sans text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 animate-pulse"
            >
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Analyzing...
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Scanning your transactions for subscriptions</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // State 3: Has pending detections
  if (hasBanks && detectionCount > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="default"
              className="font-sans text-xs bg-green-500 hover:bg-green-600 animate-pulse cursor-pointer"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {detectionCount} Detection{detectionCount > 1 ? 's' : ''}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Review {detectionCount} detected subscription{detectionCount > 1 ? 's' : ''}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // State 4: Fully operational (banks connected, no pending detections)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className="font-sans text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Monitoring
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Tracking price changes & renewals</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
