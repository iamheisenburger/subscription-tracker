"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Mail, ShieldAlert, ShieldCheck, AlertTriangle, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { DetectionReviewModal } from "../detection/detection-review-modal";
import { useUserTier } from "@/hooks/use-user-tier";
import { AutomateUpgradeCard } from "../automate/automate-upgrade-card";

export function AutomationHealthTab() {
  const { user } = useUser();
  const [reviewOpen, setReviewOpen] = useState(false);
  const { isAutomate, isLoading: isTierLoading } = useUserTier();

  const health = useQuery(
    api.insights.getAutomationHealth,
    user?.id && isAutomate ? { clerkUserId: user.id } : "skip"
  );

  if (isTierLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!isAutomate) {
    return (
      <AutomateUpgradeCard
        title="Email detection insights live on Automate"
        description="Track Gmail health, detections, and scan performance after upgrading."
        features={[
          "Live Gmail connection status & scan telemetry",
          "Detection queue + review workflows",
          "Weekly autoscan verification + alerting",
        ]}
      />
    );
  }

  if (!user?.id) {
    return null;
  }

  if (health === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Email Detection</CardTitle>
          <CardDescription className="font-sans">
            Connect Gmail to start automatic subscription detection.
          </CardDescription>
        </CardHeader>
        <CardContent className="font-sans text-sm text-muted-foreground space-y-4">
          <p>
            We couldn&apos;t load your automation status. Try refreshing the page or reconnecting
            your email.
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusIcon =
    health.status === "ok" ? (
      <ShieldCheck className="h-4 w-4 text-green-600" />
    ) : health.status === "warning" ? (
      <AlertTriangle className="h-4 w-4 text-amber-500" />
    ) : (
      <ShieldAlert className="h-4 w-4 text-red-600" />
    );

  const statusLabel =
    health.status === "ok" ? "Healthy" : health.status === "warning" ? "Needs attention" : "Error";

  const gmail = health.gmail;
  const detection = health.detection;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0 pb-4">
          <div className="space-y-1 w-full">
            <CardTitle className="font-sans">Email Detection</CardTitle>
            <CardDescription className="font-sans">
              Status of Gmail connection, weekly autoscan, and detection queue.
            </CardDescription>
          </div>
          <div className="w-full sm:w-auto flex justify-start sm:justify-end">
            <Badge
              variant={health.status === "ok" ? "default" : health.status === "warning" ? "secondary" : "destructive"}
              className="flex items-center gap-1 font-sans w-full sm:w-auto justify-center sm:justify-start"
            >
              {statusIcon}
              <span>{statusLabel}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-sans">Gmail connection</p>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-sans">
                {gmail?.email ?? "Not connected"}
              </span>
            </div>
            {gmail && (
              <p className="text-xs text-muted-foreground font-sans">
                Status: <span className="font-medium">{gmail.status}</span>
              </p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-sans">Pending detections</p>
            <p className="text-2xl font-bold font-sans">{detection.pending}</p>
            <p className="text-xs text-muted-foreground font-sans">
              {detection.total} total detections so far
            </p>
            {detection.pending > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="mt-1 font-sans flex items-center gap-1"
                onClick={() => setReviewOpen(true)}
              >
                <Sparkles className="h-4 w-4" />
                Review detections
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-sans">Scan activity</CardTitle>
          <CardDescription className="font-sans">
            Recent email scan details and last activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {gmail?.lastFullScanAt || gmail?.lastSyncedAt ? (
            <p className="text-sm font-sans">
              Last scan{" "}
              {formatDistanceToNow(
                gmail.lastSyncedAt ?? gmail.lastFullScanAt ?? Date.now(),
                { addSuffix: true }
              )}
              .
            </p>
          ) : (
            <p className="text-sm text-muted-foreground font-sans">
              No scans have been completed yet.
            </p>
          )}
          {gmail && (
            <p className="text-xs text-muted-foreground font-sans">
              Scan status: {gmail.scanStatus ?? "n/a"} • AI status:{" "}
              {gmail.aiProcessingStatus ?? "n/a"}
            </p>
          )}
          {!gmail && (
            <Button
              size="sm"
              className="mt-2 font-sans"
              onClick={() => {
                window.location.href = "/api/gmail/auth";
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              Connect Gmail
            </Button>
          )}
          {gmail && gmail.status === "requires_reauth" && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 font-sans"
              onClick={() => {
                window.location.href = "/api/gmail/auth";
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              Reconnect Gmail
            </Button>
          )}
        </CardContent>
      </Card>

      <DetectionReviewModal open={reviewOpen} onOpenChange={setReviewOpen} />
    </div>
  );
}

