"use client";

/**
 * DetectionBadge Component
 * Shows notification badge with count of pending detections
 */

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import { DetectionReviewModal } from "./detection-review-modal";

export function DetectionBadge() {
  const { user } = useUser();
  const clerkUserId = user?.id;
  const [modalOpen, setModalOpen] = useState(false);

  // Query pending candidates count
  const candidates = useQuery(
    api.detection.getPendingCandidates,
    clerkUserId ? { clerkUserId } : "skip"
  );

  const count = candidates?.length || 0;

  // Don't show if no pending detections
  if (count === 0) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="relative inline-flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
        title={`${count} new subscription${count !== 1 ? "s" : ""} detected`}
      >
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">{count} New</span>
        {/* Pulse Animation */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
        </span>
      </button>

      <DetectionReviewModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
