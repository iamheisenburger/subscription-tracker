"use client";

/**
 * Automate Detection Queue Component
 * Shows pending subscription detections as primary dashboard content for Automate users
 * Mobile-optimized with horizontal scroll cards
 */

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronRight, TrendingUp } from "lucide-react";
import { DetectionReviewModal } from "../detection/detection-review-modal";
import { useUserTier } from "@/hooks/use-user-tier";

interface DetectionCardProps {
  merchant: string;
  amount: number;
  currency: string;
  frequency: string;
  confidence: number;
  onReview: () => void;
}

function DetectionCard({ merchant, amount, currency, frequency, confidence }: DetectionCardProps) {
  const confidenceColor = confidence >= 0.8 ? "bg-green-500" : confidence >= 0.6 ? "bg-yellow-500" : "bg-orange-500";
  const confidenceLabel = confidence >= 0.8 ? "High" : confidence >= 0.6 ? "Medium" : "Low";

  return (
    <div className="flex-shrink-0 w-full sm:w-[320px] p-4 border rounded-lg bg-card hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium font-sans text-base mb-1">{merchant}</h4>
          <p className="text-2xl font-bold font-sans text-foreground">
            {currency === "USD" ? "$" : currency}
            {amount.toFixed(2)}
            <span className="text-sm font-normal text-muted-foreground ml-1">/{frequency}</span>
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${confidenceColor}`} />
          <span className="text-xs">{confidenceLabel}</span>
        </Badge>
      </div>

      {/* Confidence Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Confidence</span>
          <span>{Math.round(confidence * 100)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${confidenceColor}`}
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>

      <Button variant="default" size="sm" className="w-full font-sans" asChild>
        <div className="flex items-center justify-center gap-2 cursor-pointer">
          <span>Review</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </Button>
    </div>
  );
}

export function AutomateDetectionQueue() {
  const { user } = useUser();
  const { tier } = useUserTier();
  const clerkUserId = user?.id;
  const [modalOpen, setModalOpen] = useState(false);

  // Query pending candidates
  const candidates = useQuery(
    api.detection.getPendingCandidates,
    clerkUserId ? { clerkUserId } : "skip"
  );

  // Only show for Automate users
  if (tier !== "automate_1") {
    return null;
  }

  const count = candidates?.length || 0;

  // Don't show if no pending detections
  if (count === 0) {
    return null;
  }

  // Limit to first 5 for preview
  const previewCandidates = candidates?.slice(0, 5) || [];

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-2">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold font-sans flex items-center gap-2">
                  Pending Detections
                  <Badge variant="default" className="font-sans">
                    {count} New
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground font-sans mt-1">
                  Review and approve detected subscriptions from your bank transactions
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="font-sans hidden sm:flex"
            >
              View All
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Horizontal Scroll Container - Mobile optimized */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-4 pb-2">
              {previewCandidates.map((candidate) => (
                <DetectionCard
                  key={candidate._id}
                  merchant={candidate.proposedName}
                  amount={candidate.proposedAmount}
                  currency={candidate.proposedCurrency}
                  frequency={candidate.proposedCadence === "monthly" ? "mo" : candidate.proposedCadence === "yearly" ? "yr" : "wk"}
                  confidence={candidate.confidence}
                  onReview={() => setModalOpen(true)}
                />
              ))}
            </div>
          </div>

          {/* Mobile: Show View All button at bottom */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="w-full mt-4 font-sans sm:hidden"
          >
            View All {count} Detections
          </Button>

          {/* Insights Row */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="font-sans">
              {count > 3 ? "Multiple subscriptions detected" : "New subscription detected"} from your recent transactions
            </span>
          </div>
        </CardContent>
      </Card>

      <DetectionReviewModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
