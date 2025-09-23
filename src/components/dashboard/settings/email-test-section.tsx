"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export function EmailTestSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-sans">
          <Mail className="h-5 w-5" />
          Email Notifications
        </CardTitle>
        <CardDescription className="font-sans">
          Automated notifications for renewals, price changes, and spending thresholds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium font-sans">Notification System Status</h4>
          <p className="text-sm text-muted-foreground font-sans">
            The notification system runs automatically in the background.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="font-sans">Renewal reminders are sent 3 days before billing</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="font-sans">Price change alerts are sent when subscription costs change</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="font-sans">Spending alerts notify you when approaching budget thresholds</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground font-sans">
          All notifications are processed hourly. Configure preferences in the section above.
        </p>
      </CardContent>
    </Card>
  );
}
