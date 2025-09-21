"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface UpcomingRenewalsProps {
  userId: string;
}

export function UpcomingRenewalsFallback({ userId }: UpcomingRenewalsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans">Upcoming Renewals</CardTitle>
        <CardDescription className="font-sans">Next 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground py-8 font-sans">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Environment setup required</p>
          <p className="text-xs mt-2">Configure .env.local to see renewals</p>
        </div>
      </CardContent>
    </Card>
  );
}
