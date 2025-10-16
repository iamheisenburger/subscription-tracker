"use client";

/**
 * Detection Queue Empty State Component
 * Educational placeholder shown when no detections are pending
 * Explains what auto-detection does and when users will see results
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Clock, CheckCircle2 } from "lucide-react";

export function DetectionQueueEmptyState() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <div className="rounded-full bg-primary/10 p-2">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-sans">Auto-Detection Active</CardTitle>
            <CardDescription className="text-xs font-sans">
              Monitoring your transactions for recurring subscriptions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium font-sans text-foreground">How it works</p>
              <p className="text-xs text-muted-foreground font-sans">
                We scan your connected bank accounts daily for recurring charges. When we detect a pattern, you&apos;ll see it here for review.
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
              No pending detections right now. New charges are analyzed automatically.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
