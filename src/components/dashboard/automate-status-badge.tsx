"use client";

/**
 * Automate Status Badge Component
 * Always-visible header indicator showing Automate tier feature status
 * Shows detection progress from email scanning
 */

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { useUserTier } from "@/hooks/use-user-tier";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export function AutomateStatusBadge() {
  const { tier } = useUserTier();
  const { user } = useUser();

  // Query pending detection candidates
  const candidates = useQuery(
    api.detection.getPendingCandidates,
    user?.id ? { clerkUserId: user.id } : "skip"
  );

  // Only show for Automate tier
  if (tier !== "automate_1") {
    return null;
  }

  const detectionCount = candidates?.length || 0;

  // Has pending detections
  if (detectionCount > 0) {
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

  // Fully operational (no pending detections)
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
          <p className="text-xs">Email detection active</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
