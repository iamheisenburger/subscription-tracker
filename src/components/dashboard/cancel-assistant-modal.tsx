"use client";

/**
 * Cancel Assistant Modal
 * Provides step-by-step cancellation guidance for subscriptions
 */

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  ExternalLink,
  Clock,
  Lightbulb,
  AlertCircle,
} from "lucide-react";
import { getPlaybook, getGenericCancellationTips } from "@/lib/cancel-playbooks";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

interface CancelAssistantModalProps {
  subscription: Doc<"subscriptions">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelAssistantModal({
  subscription,
  open,
  onOpenChange,
}: CancelAssistantModalProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const { user } = useUser();
  const markCancelled = useMutation(api.subscriptions.markSubscriptionCancelled);

  const playbook = getPlaybook(subscription.name);
  const genericTips = !playbook ? getGenericCancellationTips() : null;

  const toggleStepComplete = (stepNumber: number) => {
    setCompletedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepNumber)) {
        newSet.delete(stepNumber);
      } else {
        newSet.add(stepNumber);
      }
      return newSet;
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "hard":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const handleMarkCancelled = async () => {
    if (!user?.id) {
      toast.error("You need to be signed in to update this subscription.");
      return;
    }
    try {
      await markCancelled({
        clerkId: user.id,
        subscriptionId: subscription._id as Id<"subscriptions">,
      });
      toast.success("Marked as cancelled in SubWise. We’ll include this in your savings.");
      onOpenChange(false);
    } catch (error) {
      console.error("Error marking subscription as cancelled:", error);
      toast.error("Failed to mark subscription as cancelled. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-sans text-2xl flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            Cancel Assistant: {subscription.name}
          </DialogTitle>
          <DialogDescription className="font-sans">
            {playbook
              ? "Follow these steps to cancel your subscription"
              : "General cancellation tips for this service"}
          </DialogDescription>
        </DialogHeader>

        {playbook ? (
          <div className="space-y-6">
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className={getDifficultyColor(playbook.difficulty)}>
                {playbook.difficulty.charAt(0).toUpperCase() + playbook.difficulty.slice(1)} Difficulty
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {playbook.estimatedTime}
              </div>
              {playbook.requiresCall && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-700">
                  <Phone className="h-3 w-3 mr-1" />
                  Phone Required
                </Badge>
              )}
              {playbook.requiresEmail && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700">
                  <Mail className="h-3 w-3 mr-1" />
                  Email Required
                </Badge>
              )}
            </div>

            {/* Quick Links */}
            {(playbook.cancellationUrl || playbook.supportPhone || playbook.supportEmail) && (
              <div className="space-y-2">
                {playbook.cancellationUrl && (
                  <a
                    href={playbook.cancellationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Cancellation Page
                  </a>
                )}
                {playbook.supportPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${playbook.supportPhone}`} className="hover:underline">
                      {playbook.supportPhone}
                    </a>
                  </div>
                )}
                {playbook.supportEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${playbook.supportEmail}`} className="hover:underline">
                      {playbook.supportEmail}
                    </a>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Steps */}
            <div className="space-y-4">
              <h3 className="font-semibold font-sans text-lg">Cancellation Steps</h3>
              {playbook.steps.map((step) => {
                const isCompleted = completedSteps.has(step.step);
                return (
                  <div
                    key={step.step}
                    className={`p-4 border rounded-lg transition-all ${
                      isCompleted ? "bg-green-500/5 border-green-500/20" : "bg-card"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleStepComplete(step.step)}
                        className={`mt-1 flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isCompleted
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300 hover:border-green-500"
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </button>
                      <div className="flex-1 space-y-2">
                        <div className="font-medium font-sans">
                          Step {step.step}: {step.instruction}
                        </div>
                        {step.tip && (
                          <Alert className="bg-blue-500/5 border-blue-500/20">
                            <Lightbulb className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="font-sans text-sm">
                              <strong>Tip:</strong> {step.tip}
                            </AlertDescription>
                          </Alert>
                        )}
                        {step.warning && (
                          <Alert className="bg-amber-500/5 border-amber-500/20">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="font-sans text-sm">
                              <strong>Warning:</strong> {step.warning}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Additional Info */}
            {playbook.additionalInfo && playbook.additionalInfo.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold font-sans">Important Information</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {playbook.additionalInfo.map((info, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {info}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Alternative Options */}
            {playbook.alternativeOptions && playbook.alternativeOptions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold font-sans">Alternative Options</h3>
                  <p className="text-sm text-muted-foreground">
                    Consider these alternatives before canceling:
                  </p>
                  <ul className="space-y-1 text-sm">
                    {playbook.alternativeOptions.map((option, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        ) : (
          // Generic tips for services without playbooks
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-sans">
                We don&apos;t have specific cancellation steps for {subscription.name} yet, but here are
                general tips that usually work:
              </AlertDescription>
            </Alert>

            <ul className="space-y-2">
              {genericTips!.map((tip, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>

            <Alert className="bg-blue-500/5 border-blue-500/20">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <AlertDescription className="font-sans text-sm">
                <strong>Pro tip:</strong> Always request written confirmation of your cancellation
                and take screenshots throughout the process.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <Separator />

        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
          <div className="text-xs text-muted-foreground font-sans">
            Once you&apos;ve completed these steps, you can mark this subscription as cancelled in
            SubWise to track your savings.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button variant="secondary" onClick={handleMarkCancelled}>
              I&apos;ve cancelled this
            </Button>
            {playbook?.cancellationUrl && (
              <Button asChild>
                <a href={playbook.cancellationUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Start Cancellation
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
