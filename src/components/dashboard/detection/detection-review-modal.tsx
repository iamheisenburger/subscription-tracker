"use client";

/**
 * DetectionReviewModal Component
 * Modal to review and accept/dismiss detected subscriptions
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DetectionCandidateCard } from "./detection-candidate-card";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DetectionReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DetectionReviewModal({
  open,
  onOpenChange,
}: DetectionReviewModalProps) {
  const { user } = useUser();
  const clerkUserId = user?.id;

  // Query pending candidates
  const candidates = useQuery(
    api.detection.getPendingCandidates,
    clerkUserId ? { clerkUserId } : "skip"
  );

  // Mutations
  const acceptMutation = useMutation(api.detection.acceptCandidate);
  const dismissMutation = useMutation(api.detection.dismissCandidate);

  const handleAccept = async (candidateId: string, overrides?: Record<string, unknown>) => {
    if (!clerkUserId) return;

    try {
      await acceptMutation({
        candidateId: candidateId as any,
        clerkUserId,
        overrides,
      });
      toast.success("Subscription added!");
    } catch (error) {
      console.error("Failed to accept candidate:", error);
      toast.error("Failed to add subscription");
      throw error;
    }
  };

  const handleDismiss = async (candidateId: string) => {
    if (!clerkUserId) return;

    try {
      await dismissMutation({
        candidateId: candidateId as any,
        clerkUserId,
      });
      toast.success("Detection dismissed");
    } catch (error) {
      console.error("Failed to dismiss candidate:", error);
      toast.error("Failed to dismiss");
      throw error;
    }
  };

  const isLoading = candidates === undefined;
  const hasCandidates = candidates && candidates.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Review Detected Subscriptions
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && !hasCandidates && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium font-sans mb-1">
              No Pending Detections
            </h3>
            <p className="text-sm text-muted-foreground font-sans text-center max-w-sm">
              We&apos;ll notify you when we detect new recurring subscriptions from
              your transactions.
            </p>
          </div>
        )}

        {!isLoading && hasCandidates && (
          <ScrollArea className="max-h-[calc(85vh-120px)]">
            <div className="space-y-4 pr-4">
              {candidates.map((candidate) => (
                <DetectionCandidateCard
                  key={candidate._id}
                  candidate={candidate}
                  onAccept={handleAccept}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
