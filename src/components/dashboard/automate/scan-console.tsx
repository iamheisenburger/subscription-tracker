"use client";

/**
 * ScanConsole Component
 * Transparent, reactive scan console that shows the complete scan lifecycle
 * Replaces ConnectedEmailsWidget with a professional stepper-based UI
 */

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { DetectionReviewModal } from "../detection/detection-review-modal";
import { cn } from "@/lib/utils";

type ScanStep = "connect" | "preflight" | "gmail_scan" | "parse" | "detect" | "review";

interface StepConfig {
  label: string;
  description: string;
  icon: typeof Check;
}

const STEP_CONFIG: Record<ScanStep, StepConfig> = {
  connect: {
    label: "Connect",
    description: "Connect your Gmail account",
    icon: Mail,
  },
  preflight: {
    label: "Preflight",
    description: "Preparing to scan",
    icon: Loader2,
  },
  gmail_scan: {
    label: "Gmail Scan",
    description: "Collecting emails from your inbox",
    icon: Mail,
  },
  parse: {
    label: "Parse",
    description: "Analyzing receipts with AI",
    icon: Loader2,
  },
  detect: {
    label: "Detect",
    description: "Creating subscription suggestions",
    icon: Sparkles,
  },
  review: {
    label: "Review",
    description: "Ready for your review",
    icon: CheckCircle2,
  },
};

const STEP_ORDER: ScanStep[] = [
  "connect",
  "preflight",
  "gmail_scan",
  "parse",
  "detect",
  "review",
];

export function ScanConsole() {
  const { user } = useUser();
  const [isScanning, setIsScanning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const connections = useQuery(
    api.emailConnections.getUserConnections,
    user?.id ? { clerkUserId: user.id } : "skip"
  );

  const scanStats = useQuery(
    api.emailScanner.getUserScanStats,
    user?.id ? { clerkUserId: user.id } : "skip"
  );

  const detectionStats = useQuery(
    api.emailDetection.getEmailDetectionStats,
    user?.id ? { clerkUserId: user.id } : "skip"
  );

  const triggerScan = useAction(api.emailScannerActions.triggerUserEmailScan);

  // Loading state
  if (connections === undefined || scanStats === undefined || detectionStats === undefined) {
    return (
      <Card>
        <CardContent className="py-4">
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Get Gmail connection
  const gmailConnection = connections?.find((c) => c.provider === "gmail");
  const hasCompletedScan = Boolean(gmailConnection?.lastFullScanAt);
  const isActive = gmailConnection?.status === "active";
  const requiresReauth = gmailConnection?.status === "requires_reauth";

  // Treat scan as "actively running" only when backend reports an in‑progress state.
  // Guard against stale scanState values like "processing_batch_X" once both
  // scanStatus and aiProcessingStatus are complete.
  const scanStatus = gmailConnection?.scanStatus;
  const aiStatus = gmailConnection?.aiProcessingStatus;
  const scanState = gmailConnection?.scanState;

  const isScanningState = Boolean(
    gmailConnection &&
      (
        scanStatus === "scanning" ||
        aiStatus === "processing" ||
        (scanState &&
          scanState !== "complete" &&
          scanState !== "failed" &&
          scanState !== "reviewing")
      ) &&
      // If both status flags are complete, treat the scan as finished even if
      // scanState still has an intermediate value.
      !(scanStatus === "complete" && aiStatus === "complete")
  );

  // Derive current step from connection state
  const getCurrentStep = (): ScanStep => {
    if (!gmailConnection || requiresReauth) {
      return "connect";
    }

    // If no scan has ever been run, only show "connect" as completed
    if (!hasCompletedScan && !isScanningState) {
      return "connect";
    }

    const scanState = gmailConnection.scanState;
    const scanStatus = gmailConnection.scanStatus;
    const aiStatus = gmailConnection.aiProcessingStatus;

    // If the backend says both scanning and AI processing are complete,
    // always show the final "Review" step regardless of any stale scanState.
    if (scanStatus === "complete" && aiStatus === "complete") {
      return "review";
    }

    // Only show steps beyond "connect" if scan is actively running
    if (!isScanningState) {
      return "connect";
    }

    // Map backend states to steps
    if (scanState === "queued" || scanState === "connecting") {
      return "preflight";
    }
    if (scanState === "collecting" || scanStatus === "scanning") {
      return "gmail_scan";
    }
    if (
      scanState === "parsing" ||
      scanState?.startsWith("processing_batch_") ||
      scanState === "paused_safe_mode" ||
      aiStatus === "processing"
    ) {
      return "parse";
    }
    if (scanState === "detecting") {
      return "detect";
    }
    if (scanState === "reviewing" || scanState === "complete") {
      return "review";
    }

    // Default fallback
    return "preflight";
  };

  const currentStep = getCurrentStep();
  const currentStepIndex = STEP_ORDER.indexOf(currentStep);

  // Calculate progress for progress bar (only when we have real denominators)
  const getProgressData = () => {
    const aiTotal = gmailConnection?.aiTotalCount || 0;
    const aiProcessed = gmailConnection?.aiProcessedCount || 0;
    const overallTotal = gmailConnection?.overallTotal || 0;
    const overallProgress = gmailConnection?.overallProgress || 0;

    // Prefer AI counts, fallback to overall progress
    if (aiTotal > 0) {
      return {
        processed: aiProcessed,
        total: aiTotal,
        percent: Math.min(100, (aiProcessed / aiTotal) * 100),
        hasValidProgress: true,
      };
    }
    if (overallTotal > 0) {
      return {
        processed: overallProgress,
        total: overallTotal,
        percent: Math.min(100, (overallProgress / overallTotal) * 100),
        hasValidProgress: true,
      };
    }

    return {
      processed: 0,
      total: 0,
      percent: 0,
      hasValidProgress: false,
    };
  };

  const progressData = getProgressData();
  const isPausedBySafeMode = gmailConnection?.scanState === "paused_safe_mode";

  // Handle first scan
  const handleFirstScan = async () => {
    if (!user?.id) return;

    setIsScanning(true);
    try {
      const result = await triggerScan({ clerkUserId: user.id });
      if (result.success === false && result.error) {
        toast.error("Scan blocked", {
          description: result.error,
          duration: 8000,
        });
        return;
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Failed to start email scan. Please try again.";
      toast.error("Scan failed", {
        description: message,
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Handle Gmail connection
  const handleConnectGmail = () => {
    window.location.href = "/api/gmail/auth";
  };

  // No connection state
  if (!gmailConnection) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium font-sans text-sm">Email Detection</p>
                <p className="text-xs text-muted-foreground font-sans">
                  Connect Gmail to automatically scan for subscriptions
                </p>
              </div>
            </div>
            <Button onClick={handleConnectGmail} size="sm" className="font-sans">
              <Mail className="h-4 w-4 mr-2" />
              Connect Gmail
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Cooldown is enforced server-side, no need to display it in UI

  // Last scan time
  const lastScanTime =
    gmailConnection.lastSyncedAt || gmailConnection.lastFullScanAt || scanStats?.lastScanAt;
  const lastScanText = lastScanTime
    ? `Last scanned ${formatDistanceToNow(lastScanTime, { addSuffix: true })}`
    : null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg font-semibold font-sans">Email Detection</CardTitle>
                  {isActive ? (
                    <Badge variant="default" className="font-sans text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : requiresReauth ? (
                    <Badge variant="secondary" className="font-sans text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Reauth needed
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="font-sans text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Error
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground font-sans">
                  <span className="truncate">{gmailConnection.email}</span>
                  {scanStats?.totalReceipts !== undefined && scanStats.totalReceipts > 0 && (
                    <>
                      <span>•</span>
                      <span>{scanStats.totalReceipts} emails scanned so far</span>
                    </>
                  )}
                  {lastScanText && (
                    <>
                      <span>•</span>
                      <span>{lastScanText}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {requiresReauth ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnectGmail}
                  className="font-sans"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reconnect
                </Button>
              ) : isActive ? (
                <>
                  {hasCompletedScan && (
                    <Badge variant="secondary" className="font-sans text-xs mr-2">
                      Weekly incremental enabled
                    </Badge>
                  )}
                  {!hasCompletedScan && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleFirstScan}
                      disabled={isScanning || isScanningState}
                      className="font-sans"
                    >
                      {isScanning || isScanningState ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Run first scan
                        </>
                      )}
                    </Button>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stepper */}
          <div className="relative">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {STEP_ORDER.map((step, index) => {
                const stepConfig = STEP_CONFIG[step];
                const StepIcon = stepConfig.icon;
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isUpcoming = index > currentStepIndex;

                return (
                  <div key={step} className="flex items-center flex-shrink-0">
                    <div className="flex flex-col items-center gap-1 min-w-[70px] sm:min-w-[80px]">
                      <div
                        className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                          isCompleted &&
                            "bg-primary border-primary text-primary-foreground",
                          isCurrent &&
                            "bg-primary/10 border-primary text-primary",
                          isUpcoming && "bg-muted border-muted-foreground/20 text-muted-foreground"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : isCurrent && step === "connect" && isActive && !isScanningState ? (
                          // Connect step: show checkmark when connected (not scanning)
                          <Check className="h-4 w-4" />
                        ) : (
                          <StepIcon
                            className={cn(
                              "h-4 w-4",
                              isCurrent && step !== "connect" && "animate-spin"
                            )}
                          />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium text-center",
                          isCurrent && "text-primary",
                          isUpcoming && "text-muted-foreground"
                        )}
                      >
                        {stepConfig.label}
                      </span>
                    </div>
                    {index < STEP_ORDER.length - 1 && (
                      <div
                        className={cn(
                          "h-0.5 w-12 mx-1 transition-colors",
                          isCompleted ? "bg-primary" : "bg-muted"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {/* Safe mode pause notice */}
            {isPausedBySafeMode && (
              <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-200 text-center font-sans">
                Scan paused by Safe Mode to prevent unexpected costs. Resume automatically once Safe Mode is turned off.
              </div>
            )}

            {/* Current step description with inline parse status */}
            {isScanningState && (
              <div className="mt-3 text-sm text-muted-foreground font-sans text-center">
                {STEP_CONFIG[currentStep].description}
                {currentStep === "parse" && gmailConnection?.currentBatch && gmailConnection?.totalBatches && (
                  <span className="ml-2 text-xs">
                    (Batch {gmailConnection.currentBatch}/{gmailConnection.totalBatches}
                    {progressData.hasValidProgress && ` • ${progressData.processed}/${progressData.total}`})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Gmail Scan status - Text only, no loading bar - Only show when actively scanning */}
          {isScanningState && 
           currentStep === "gmail_scan" && 
           progressData.hasValidProgress &&
           progressData.processed < progressData.total && (
            <div className="mt-2 text-xs text-muted-foreground font-sans text-center">
              {progressData.processed} / {progressData.total} emails collected
            </div>
          )}


          {/* Non-numeric active state - Only show when no valid progress */}
          {isScanningState && 
           !progressData.hasValidProgress && 
           currentStep !== "gmail_scan" && 
           currentStep !== "parse" && (
            <div className="p-3 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300 font-sans">
                  {STEP_CONFIG[currentStep].description}
                </span>
              </div>
            </div>
          )}

          {/* Completed summary (static, not live progress) */}
          {!isScanningState && hasCompletedScan && scanStats && (
            <div className="p-3 border border-muted rounded-lg bg-muted/30">
              <div className="text-xs text-muted-foreground font-sans">
                {scanStats.totalReceipts > 0 && (
                  <span>
                    {scanStats.parsedReceipts} of {scanStats.totalReceipts} emails analyzed
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Weekly incremental messaging */}
          {hasCompletedScan && !isScanningState && (
            <div className="text-xs text-muted-foreground font-sans">
              <span>New emails are scanned automatically once a week</span>
            </div>
          )}

          {/* Detection CTA */}
          {detectionStats && detectionStats.pending > 0 && (
            <div className="p-3 border border-green-200 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-green-700 dark:text-green-300 font-sans mb-1">
                    {detectionStats.pending} new subscription
                    {detectionStats.pending > 1 ? "s" : ""} detected
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 font-sans mb-3">
                    Review and confirm to start tracking them
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setModalOpen(true)}
                    className="font-sans"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Review detections
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {gmailConnection.errorMessage && (
            <div className="p-3 border border-orange-200 rounded-lg bg-orange-50 dark:bg-orange-950/20">
              <p className="text-xs text-orange-700 dark:text-orange-300 font-sans">
                {gmailConnection.errorMessage}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <DetectionReviewModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}

