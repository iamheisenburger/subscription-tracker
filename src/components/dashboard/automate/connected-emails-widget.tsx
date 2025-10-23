"use client";

/**
 * Connected Emails Widget - COMPACT VERSION
 * Shows email connection status on dashboard for Automate tier users
 * Redesigned to take minimal vertical space (~80px vs ~250px)
 */

import { useQuery, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

export function ConnectedEmailsWidget() {
  const { user } = useUser();
  const [isScanning, setIsScanning] = useState(false);

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

  if (connections === undefined || scanStats === undefined || detectionStats === undefined) {
    return (
      <Card>
        <CardContent className="py-4">
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const handleManualScan = async () => {
    if (!user?.id) return;

    // COST OPTIMIZATION: Check if this is first scan or incremental
    const gmailConnection = connections?.find((c) => c.provider === "gmail");
    const isFirstScan = !gmailConnection?.lastFullScanAt;

    // Show different messaging based on scan type
    let confirmMessage = "";
    let toastDescription = "";

    if (isFirstScan) {
      // FIRST SCAN: Full inbox (expensive but one-time)
      confirmMessage =
        "📧 FIRST SCAN - Full Inbox Analysis\n\n" +
        "⏱️ Time: ~10-15 minutes (3 API keys working in parallel)\n" +
        "💰 Cost: ~$1.50 (one-time only)\n" +
        "📊 Will analyze: ~400-500 receipts (pre-filtered from 900+)\n\n" +
        "Future scans will be MUCH faster (2-3 min) and cheaper ($0.08).\n\n" +
        "This runs in the background - you can close this page.\n\n" +
        "Continue with first scan?";

      toastDescription = "First scan started! ~10-15 min, $1.50 cost. Future scans will be WAY cheaper ($0.08). You can close this page.";
    } else {
      // INCREMENTAL SCAN: Only new emails (super cheap!)
      confirmMessage =
        "📧 INCREMENTAL SCAN - New Emails Only\n\n" +
        "⏱️ Time: ~2-3 minutes\n" +
        "💰 Cost: ~$0.08\n" +
        "📊 Will analyze: Only NEW emails since your last scan\n\n" +
        "This runs in the background - you can close this page.\n\n" +
        "Continue with scan?";

      toastDescription = "Incremental scan started! ~2-3 min, $0.08 cost. Only scanning new emails. You can close this page.";
    }

    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) return;

    setIsScanning(true);
    try {
      await triggerScan({ clerkUserId: user.id });
      toast.success(
        isFirstScan ? "First scan started! 🚀" : "Incremental scan started! ⚡",
        {
          description: toastDescription,
          duration: 10000, // Show for 10 seconds
        }
      );
    } catch (error) {
      toast.error("Scan failed", {
        description: "Failed to start email scan. Please try again.",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectGmail = () => {
    // Directly trigger OAuth flow (no redirect to settings)
    window.location.href = "/api/gmail/auth";
  };

  // If no connections, show compact empty state
  if (!connections || connections.length === 0) {
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

  // Get Gmail connection
  const gmailConnection = connections.find((c) => c.provider === "gmail");

  if (!gmailConnection) {
    return null;
  }

  const totalReceipts = scanStats?.totalReceipts || 0;
  const totalDetections = detectionStats?.totalEmailDetections || 0;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Connection Status */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium font-sans text-sm">Email Detection</p>
                {gmailConnection.status === "active" ? (
                  <Badge variant="default" className="font-sans text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : gmailConnection.status === "requires_reauth" ? (
                  <Badge variant="secondary" className="font-sans text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Reauth
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
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {totalReceipts} receipts
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-primary">
                  <Sparkles className="h-3 w-3" />
                  {totalDetections} detected
                </span>
                {gmailConnection.lastSyncedAt && (
                  <>
                    <span>•</span>
                    <span>
                      Scanned {formatDistanceToNow(gmailConnection.lastSyncedAt, { addSuffix: true })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {gmailConnection.status === "requires_reauth" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleConnectGmail}
                className="font-sans"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reconnect
              </Button>
            ) : gmailConnection.status === "active" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualScan}
                disabled={isScanning}
                className="font-sans"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? "animate-spin" : ""}`} />
                Scan Now
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleConnectGmail}
                className="font-sans"
              >
                Fix Connection
              </Button>
            )}
          </div>
        </div>

        {/* AI Processing Progress - Shows cumulative progress across all batches */}
        {(() => {
          const parsed = scanStats?.parsedReceipts || 0;
          const total = scanStats?.totalReceipts || 0;
          const unparsed = scanStats?.unparsedReceipts || 0;

          // FIXED: Check if scan is actually running, not unparsed count
          // The audit revealed unparsed is always 0 during active scans
          const isScanning = gmailConnection?.scanStatus === "scanning";
          const isProcessingAI = gmailConnection?.aiProcessingStatus === "processing";
          const isProcessing = isScanning || isProcessingAI;

          // Use AI counts if available for more accurate progress
          const aiProcessed = gmailConnection?.aiProcessedCount || 0;
          const aiTotal = gmailConnection?.aiTotalCount || 0;
          const hasAIProgress = aiTotal > 0;

          console.log('🎨 Progress UI Debug:', {
            parsed,
            total,
            unparsed,
            isProcessing,
            isScanning,
            isProcessingAI,
            scanStatus: gmailConnection?.scanStatus,
            aiProcessingStatus: gmailConnection?.aiProcessingStatus,
            aiProcessed,
            aiTotal,
            scanStats,
          });

          if (!isProcessing) {
            return null;
          }

          // Calculate progress percentage - use AI counts if available, otherwise scan stats
          const displayProcessed = hasAIProgress ? aiProcessed : parsed;
          const displayTotal = hasAIProgress ? aiTotal : total;
          const displayRemaining = hasAIProgress ? (aiTotal - aiProcessed) : unparsed;
          const progressPercent = displayTotal > 0 ? Math.min(100, (displayProcessed / displayTotal) * 100) : 0;

          // Determine status message based on scan state machine (FIX #2 from audit)
          let statusMessage = "Preparing to scan...";

          // Use explicit scan state machine for accurate status
          if (gmailConnection?.scanState) {
            switch (gmailConnection.scanState) {
              case "scanning_gmail":
                statusMessage = `Scanning inbox for receipts... ${gmailConnection?.totalEmailsScanned || 0} emails scanned`;
                break;
              case "processing_batch_1":
              case "processing_batch_2":
              case "processing_batch_3":
              case "processing_batch_4":
              case "processing_batch_5":
              case "processing_batch_6":
              case "processing_batch_7":
                const batchNum = gmailConnection.currentBatch || 1;
                const totalBatches = gmailConnection.totalBatches || 1;
                statusMessage = `Processing batch ${batchNum} of ${totalBatches}...`;
                break;
              case "complete":
                statusMessage = "Scan complete!";
                break;
              default:
                if (isProcessingAI) {
                  statusMessage = "Analyzing receipts with AI...";
                }
                break;
            }
          } else if (isScanning) {
            statusMessage = `Scanning inbox for receipts... ${gmailConnection?.totalEmailsScanned || 0} emails scanned`;
          } else if (isProcessingAI) {
            statusMessage = "Analyzing receipts with AI...";
          }

          return (
            <div className="mt-3 p-3 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 font-sans">
                  {statusMessage}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-sans">
                  {displayProcessed} / {displayTotal} receipts
                </p>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${progressPercent}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-sans">
                  {displayProcessed > 0 ? `${displayProcessed} processed` : 'Starting...'}
                </p>
                {gmailConnection?.estimatedTimeRemaining && gmailConnection.estimatedTimeRemaining > 0 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-sans">
                    ~{gmailConnection.estimatedTimeRemaining} min remaining
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Detection Alert - Show when there are pending detections */}
        {detectionStats && detectionStats.pending > 0 && (
          <div className="mt-3 p-3 border border-green-200 rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-green-700 dark:text-green-300 font-sans mb-1">
                  🎉 {detectionStats.pending} subscription{detectionStats.pending > 1 ? 's' : ''} detected!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 font-sans">
                  Review and confirm these subscriptions below to start tracking them.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error message if present */}
        {gmailConnection.errorMessage && (
          <div className="mt-3 p-3 border border-orange-200 rounded-lg bg-orange-50 dark:bg-orange-950/20">
            <p className="text-xs text-orange-700 dark:text-orange-300 font-sans">
              {gmailConnection.errorMessage}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
