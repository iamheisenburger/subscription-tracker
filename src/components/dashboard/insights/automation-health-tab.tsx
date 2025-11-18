"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Mail, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function AutomationHealthTab() {
  const { user } = useUser();

  const health = useQuery(
    api.insights.getAutomationHealth,
    user?.id ? { clerkUserId: user.id } : "skip"
  );

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
          <CardTitle className="font-sans">Automation Health</CardTitle>
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="font-sans">Automation Health</CardTitle>
            <CardDescription className="font-sans">
              Status of Gmail connection, scans, and detection queue.
            </CardDescription>
          </div>
          <Badge
            variant={health.status === "ok" ? "default" : health.status === "warning" ? "secondary" : "destructive"}
            className="flex items-center gap-1 font-sans"
          >
            {statusIcon}
            <span>{statusLabel}</span>
          </Badge>
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
    </div>
  );
}

