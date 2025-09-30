"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useUserTier } from "@/hooks/use-user-tier";

export default function FixTierPage() {
  const { user, isLoaded } = useUser();
  const { tier, isPremium, subscriptionType, isLoading: tierLoading } = useUserTier();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [clerkData, setClerkData] = useState<any>(null);
  const [loadingClerkData, setLoadingClerkData] = useState(false);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      setResult(null);

      const response = await fetch("/api/sync/tier", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        // Reload page after 2 seconds to reflect changes
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setError(data.error || "Failed to sync tier");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSyncing(false);
    }
  };

  const loadClerkData = async () => {
    try {
      setLoadingClerkData(true);
      const response = await fetch("/api/sync/tier");
      const data = await response.json();
      setClerkData(data);
    } catch (err) {
      console.error("Failed to load Clerk data:", err);
    } finally {
      setLoadingClerkData(false);
    }
  };

  if (!isLoaded || tierLoading) {
    return (
      <div className="container mx-auto p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tier Detection Diagnostics</h1>
        <p className="text-muted-foreground">
          Check and fix your subscription tier status
        </p>
      </div>

      {/* Current Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current Status
            {isPremium ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
          </CardTitle>
          <CardDescription>Your current tier in SubWise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-mono text-xs">{user?.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">Tier</p>
              <Badge variant={isPremium ? "default" : "secondary"} className="text-lg px-4 py-1">
                {isPremium ? "Premium" : "Free"}
              </Badge>
            </div>
            {subscriptionType && (
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Billing</p>
                <Badge variant="outline" className="px-4 py-1">
                  {subscriptionType === "annual" ? "Annual" : "Monthly"}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sync Action */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Fix Tier Detection</CardTitle>
          <CardDescription>
            If you've subscribed to premium but still see "Free" above, click the button below to sync your status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleSync}
            disabled={syncing}
            size="lg"
            className="w-full"
          >
            {syncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Tier Status
              </>
            )}
          </Button>

          {result && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription>
                <p className="font-semibold text-green-700 dark:text-green-400">
                  {result.message}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tier: {result.tier} | Confidence: {result.confidence} | Source: {result.source}
                </p>
                {result.recovery && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium">🎉 Auto-Recovery Applied!</p>
                    <p className="text-muted-foreground">{result.recovery.solution}</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
          <CardDescription>
            Technical details from Clerk (for troubleshooting)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={loadClerkData}
            disabled={loadingClerkData}
            variant="outline"
            className="w-full"
          >
            {loadingClerkData ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load Clerk Metadata"
            )}
          </Button>

          {clerkData && (
            <div className="bg-muted p-4 rounded-md overflow-auto max-h-96">
              <pre className="text-xs">{JSON.stringify(clerkData, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert className="mt-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold mb-2">Still having issues?</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Make sure you've completed payment in Clerk</li>
            <li>Check that your subscription is "Active" in Clerk dashboard</li>
            <li>Try clicking "Sync Tier Status" button above</li>
            <li>If issue persists, contact support with your User ID</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  );
}
