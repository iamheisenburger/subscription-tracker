"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Target } from "lucide-react";

interface RecentSubscriptionsProps {
  userId: string;
}

export function RecentSubscriptionsFallback({ userId }: RecentSubscriptionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-sans">Your Subscriptions</CardTitle>
          <CardDescription className="font-sans">
            Recent and active subscriptions
          </CardDescription>
        </div>
        <Button size="sm" className="font-sans" disabled>
          <Plus className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </CardHeader>
      <CardContent className="text-center py-12">
        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
          <Target className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold font-sans mb-2">Environment Setup Required</h3>
        <p className="text-muted-foreground font-sans mb-4">
          Please configure your .env.local file with Clerk and Convex credentials to start tracking subscriptions.
        </p>
        <div className="bg-muted/50 border border-border rounded-lg p-4 text-left">
          <p className="text-sm text-muted-foreground font-sans">
            <strong>Missing:</strong> .env.local file with CLERK_SECRET_KEY and NEXT_PUBLIC_CONVEX_URL
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
