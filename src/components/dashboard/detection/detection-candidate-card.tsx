"use client";

/**
 * DetectionCandidateCard Component
 * Displays a single detected subscription candidate
 */

import { useState } from "react";
import { format } from "date-fns";
import { Check, X, Sparkles, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DetectionCandidateCardProps {
  candidate: {
    _id: string;
    proposedName: string;
    proposedAmount: number;
    proposedCurrency: string;
    proposedCadence: "weekly" | "monthly" | "yearly";
    proposedNextBilling: number;
    confidence: number;
    detectionReason: string;
    merchant?: {
      displayName: string;
      knownProviderKey?: string;
    };
  };
  onAccept: (candidateId: string, overrides?: any) => Promise<void>;
  onDismiss: (candidateId: string) => Promise<void>;
}

export function DetectionCandidateCard({
  candidate,
  onAccept,
  onDismiss,
}: DetectionCandidateCardProps) {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedName, setEditedName] = useState(candidate.proposedName);
  const [editedAmount, setEditedAmount] = useState(
    candidate.proposedAmount.toString()
  );

  const handleAccept = async () => {
    try {
      setLoading(true);
      const overrides = editing
        ? {
            name: editedName,
            amount: parseFloat(editedAmount),
          }
        : undefined;
      await onAccept(candidate._id, overrides);
    } catch (error) {
      console.error("Failed to accept candidate:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      setLoading(true);
      await onDismiss(candidate._id);
    } catch (error) {
      console.error("Failed to dismiss candidate:", error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = () => {
    const confidence = candidate.confidence;
    if (confidence >= 0.9) {
      return (
        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
          High Confidence
        </span>
      );
    } else if (confidence >= 0.7) {
      return (
        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full">
          Medium Confidence
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded-full">
          Low Confidence
        </span>
      );
    }
  };

  const getCadenceLabel = () => {
    switch (candidate.proposedCadence) {
      case "weekly":
        return "Weekly";
      case "monthly":
        return "Monthly";
      case "yearly":
        return "Annually";
      default:
        return candidate.proposedCadence;
    }
  };

  return (
    <div className="p-5 border rounded-lg bg-card space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="mb-2"
                placeholder="Subscription name"
              />
            ) : (
              <h4 className="font-semibold font-sans text-lg">
                {candidate.proposedName}
              </h4>
            )}
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {getConfidenceBadge()}
              <span className="text-sm text-muted-foreground font-sans">
                {getCadenceLabel()}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="p-2 hover:bg-muted rounded-md transition-colors flex-shrink-0"
        >
          <Edit2 className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-sans">
            Amount:
          </span>
          {editing ? (
            <Input
              type="number"
              step="0.01"
              value={editedAmount}
              onChange={(e) => setEditedAmount(e.target.value)}
              className="w-32 text-right"
            />
          ) : (
            <span className="text-lg font-semibold font-sans">
              {candidate.proposedCurrency}{" "}
              {candidate.proposedAmount.toFixed(2)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-sans">
            Next Billing:
          </span>
          <span className="text-sm font-medium font-sans">
            {format(new Date(candidate.proposedNextBilling), "MMM dd, yyyy")}
          </span>
        </div>
      </div>

      {/* Detection Reason */}
      <div className="p-3 bg-muted/50 rounded-md">
        <p className="text-xs text-muted-foreground font-sans">
          <strong>Why detected:</strong> {candidate.detectionReason}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={handleAccept}
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-sans disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Check className="h-4 w-4" />
          {loading ? "Adding..." : "Accept"}
        </button>
        <button
          onClick={handleDismiss}
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-input hover:bg-muted rounded-md text-sm font-sans disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <X className="h-4 w-4" />
          Dismiss
        </button>
      </div>
    </div>
  );
}
