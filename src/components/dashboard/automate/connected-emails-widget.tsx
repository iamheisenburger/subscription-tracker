"use client";

/**
 * Connected Emails Widget
 * Shows email connection status on dashboard for Automate tier users
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, CheckCircle2, AlertCircle, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
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

  const triggerScan = useMutation(api.emailScanner.triggerUserEmailScan);

  if (connections === undefined || scanStats === undefined || detectionStats === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
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

  // If no connections, show empty state
  if (!connections || connections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="font-sans">Email Detection</CardTitle>
              <CardDescription className="font-sans">
                Connect your email to automatically detect subscriptions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <div className="rounded-full bg-primary/10 p-6 w-fit mx-auto">
              <Mail className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg font-sans mb-2">No email connected</h3>
              <p className="text-sm text-muted-foreground font-sans max-w-md mx-auto mb-4">
                Connect Gmail to automatically scan for subscription receipts, invoices, and payment confirmations.
              </p>
              <Button asChild>
                <a href="/dashboard/settings">Connect Gmail</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get Gmail connection
  const gmailConnection = connections.find((c) => c.provider === "gmail");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="font-sans">Email Detection</CardTitle>
              <CardDescription className="font-sans">
                Automatic subscription scanning
              </CardDescription>
            </div>
          </div>
          {gmailConnection && gmailConnection.status === "active" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualScan}
              disabled={isScanning}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? "animate-spin" : ""}`} />
              Scan Now
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        {gmailConnection && (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white dark:bg-black p-2">
                <Mail className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="font-medium font-sans">{gmailConnection.email}</p>
                <div className="flex items-center gap-2">
                  {gmailConnection.status === "active" ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-muted-foreground font-sans">Connected</span>
                    </>
                  ) : gmailConnection.status === "requires_reauth" ? (
                    <>
                      <AlertCircle className="h-3 w-3 text-orange-600" />
                      <span className="text-xs text-muted-foreground font-sans">Needs Reauth</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 text-red-600" />
                      <span className="text-xs text-muted-foreground font-sans">Error</span>
                    </>
                  )}
                  {gmailConnection.lastSyncedAt && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground font-sans">
                        Last scanned {formatDistanceToNow(gmailConnection.lastSyncedAt, { addSuffix: true })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Badge variant={gmailConnection.status === "active" ? "default" : "secondary"}>
              {gmailConnection.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Receipts */}
          <div className="p-4 border rounded-lg space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-sans">Receipts Found</p>
            </div>
            <p className="text-2xl font-bold font-sans">{scanStats?.totalReceipts || 0}</p>
          </div>

          {/* Detections */}
          <div className="p-4 border rounded-lg space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-sans">Detections</p>
            </div>
            <p className="text-2xl font-bold font-sans text-primary">
              {detectionStats?.totalEmailDetections || 0}
            </p>
          </div>

          {/* Parsed */}
          <div className="p-4 border rounded-lg space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-xs text-muted-foreground font-sans">Processed</p>
            </div>
            <p className="text-2xl font-bold font-sans text-green-600">
              {scanStats?.parsedReceipts || 0}
            </p>
          </div>

          {/* Linked */}
          <div className="p-4 border rounded-lg space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-muted-foreground font-sans">Linked</p>
            </div>
            <p className="text-2xl font-bold font-sans text-blue-600">
              {detectionStats?.linkedReceipts || 0}
            </p>
          </div>
        </div>

        {/* Action */}
        {gmailConnection?.status === "requires_reauth" && (
          <div className="p-4 border border-orange-200 rounded-lg bg-orange-50 dark:bg-orange-950/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100 font-sans">
                  Reauthorization required
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300 font-sans">
                  Your email connection has expired. Please reconnect to continue scanning.
                </p>
                <Button size="sm" variant="outline" asChild>
                  <a href="/dashboard/settings">Reconnect Gmail</a>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        {gmailConnection?.status === "active" && (
          <div className="text-xs text-muted-foreground font-sans text-center pt-2">
            Scanning every 6 hours for new subscription receipts
          </div>
        )}
      </CardContent>
    </Card>
  );
}
