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

    setIsScanning(true);
    try {
      await triggerScan({ clerkUserId: user.id });
      toast.success("Email scan started", {
        description: "We're scanning your inbox for subscription receipts...",
      });
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

        {/* AI Processing Progress */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {"aiProcessingStatus" in gmailConnection && (gmailConnection as any).aiProcessingStatus === "processing" && (
          <div className="mt-3 p-3 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 font-sans">
                Analyzing receipts with AI...
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-sans">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {((gmailConnection as any).aiProcessedCount || 0)} / {((gmailConnection as any).aiTotalCount || 0)}
              </p>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{
                  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                  width: `${Math.min(100, (((gmailConnection as any).aiProcessedCount || 0) / ((gmailConnection as any).aiTotalCount || 1)) * 100)}%`,
                }}
              />
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
