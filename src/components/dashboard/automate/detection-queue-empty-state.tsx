"use client";

/**
 * Detection Queue Empty State Component
 * Educational placeholder shown when no detections are pending
 * Explains what auto-detection does and when users will see results
 * UPDATED: Shows connected email and last scan time
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Clock, CheckCircle2, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function DetectionQueueEmptyState() {
  const { user } = useUser();
  const [isMobile, setIsMobile] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 640px)");
    const handleChange = () => setIsMobile(mql.matches);
    handleChange();

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handleChange);
      return () => mql.removeEventListener("change", handleChange);
    }

    mql.addListener(handleChange);
    return () => mql.removeListener(handleChange);
  }, []);

  // Get email connection info
  const connections = useQuery(
    api.emailConnections.getUserConnections,
    user?.id ? { clerkUserId: user.id } : "skip"
  );

  const scanStats = useQuery(
    api.emailScanner.getUserScanStats,
    user?.id ? { clerkUserId: user.id } : "skip"
  );

  const activeConnection = connections?.[0]; // Get first (primary) connection
  const lastScanText = scanStats?.lastScanAt
    ? formatDistanceToNow(scanStats.lastScanAt, { addSuffix: true })
    : "Never scanned";

  const shouldShowDetails = !isMobile || showDetails;
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="rounded-full bg-primary/10 p-2">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-sans">Auto-Detection Active</CardTitle>
              <CardDescription className="text-xs font-sans">
                {activeConnection ? (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3" />
                    {activeConnection.email}
                  </span>
                ) : (
                  "Monitoring your email for recurring subscriptions"
                )}
              </CardDescription>
            </div>
          </div>
          {activeConnection && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-sans">Last scan</p>
              <p className="text-xs font-medium font-sans">{lastScanText}</p>
            </div>
          )}
        </div>
        {isMobile && (
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm"
          >
            {showDetails ? (
              <>
                Hide details <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                How it works <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn("space-y-3", !shouldShowDetails && "hidden sm:block")}>
          <div className="flex items-start space-x-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium font-sans text-foreground">How it works</p>
              <p className="text-xs text-muted-foreground font-sans">
                We scan your connected email daily for subscription receipts and invoices. When we detect a recurring payment, you&apos;ll see it here for review.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium font-sans text-foreground">What happens next</p>
              <p className="text-xs text-muted-foreground font-sans">
                New detections appear here with confidence scores. You can accept, edit, or dismiss each one before it becomes a tracked subscription.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground font-sans">
            <p className="flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              {activeConnection ? (
                <>
                  {(scanStats?.totalReceipts ?? 0) > 0
                    ? `No pending detections right now. We've scanned ${scanStats?.totalReceipts} ${scanStats?.totalReceipts === 1 ? 'receipt' : 'receipts'} so far.`
                    : "No pending detections right now. New charges are analyzed automatically."}
                </>
              ) : (
                "Connect your email to start automatic subscription detection."
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
