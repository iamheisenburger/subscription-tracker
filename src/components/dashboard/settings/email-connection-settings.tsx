"use client";

/**
 * Email Connection Settings Component
 * Allows users to connect/disconnect Gmail for automatic detection
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useUserTier } from "@/hooks/use-user-tier";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Mail, Trash2, RefreshCw, Lock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export function EmailConnectionSettings() {
  const { user } = useUser();
  const { isAutomate } = useUserTier();
  const searchParams = useSearchParams();

  const connections = useQuery(
    api.emailConnections.getUserConnections,
    user?.id ? { clerkUserId: user.id } : "skip"
  );

  const disconnectEmail = useMutation(api.emailConnections.disconnectEmail);

  // Tier-based limits
  const maxConnections = isAutomate ? 1 : 0;
  const currentConnections = connections?.length || 0;
  const canAddConnection = currentConnections < maxConnections;
  const requiresUpgrade = !isAutomate;

  // Handle OAuth callback messages
  useEffect(() => {
    const gmailConnected = searchParams.get("gmail_connected");
    const gmailError = searchParams.get("gmail_error");

    if (gmailConnected === "true") {
      toast.success("Gmail connected successfully!", {
        description: "We'll start scanning for subscription receipts now.",
      });
      // Clear URL params
      window.history.replaceState({}, "", "/dashboard/settings");
    }

    if (gmailError) {
      let errorMessage = "Failed to connect Gmail. Please try again.";

      switch (gmailError) {
        case "missing_params":
          errorMessage = "OAuth flow incomplete. Please try again.";
          break;
        case "token_exchange_failed":
          errorMessage = "Failed to exchange authorization code. Please try again.";
          break;
        case "no_refresh_token":
          errorMessage = "You may have already connected this account. Try disconnecting first.";
          break;
        case "userinfo_failed":
          errorMessage = "Could not retrieve your email address. Please try again.";
          break;
        case "storage_failed":
          errorMessage = "Failed to save connection. Please try again.";
          break;
      }

      toast.error("Gmail connection failed", {
        description: errorMessage,
      });
      // Clear URL params
      window.history.replaceState({}, "", "/dashboard/settings");
    }
  }, [searchParams]);

  const handleConnectGmail = () => {
    // Redirect to Gmail OAuth flow
    window.location.href = "/api/gmail/auth";
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      await disconnectEmail({
        clerkUserId: user!.id,
        connectionId: connectionId as Id<"emailConnections">,
      });
      toast.success("Email disconnected", {
        description: "Your email has been disconnected successfully.",
      });
    } catch (error) {
      console.error("Failed to disconnect email:", error);
      toast.error("Failed to disconnect email", {
        description: "Please try again or contact support.",
      });
    }
  };

  const gmailConnection = connections?.find((c) => c.provider === "gmail");
  const hasGmailConnected = !!gmailConnection;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="font-sans">Email Detection</CardTitle>
            <CardDescription className="font-sans">
              Connect your email to automatically detect subscriptions from receipts
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gmail Connection */}
        <div className="border rounded-lg p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="rounded-full bg-muted p-2">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.5 4.64 12 9.548l6.5-4.91 1.573-1.146C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-medium font-sans">Gmail</h4>
                  {hasGmailConnected && (
                    <Badge
                      variant={gmailConnection.status === "active" ? "default" : "destructive"}
                      className="font-sans"
                    >
                      {gmailConnection.status === "active" && (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Connected
                        </>
                      )}
                      {gmailConnection.status === "error" && (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Error
                        </>
                      )}
                      {gmailConnection.status === "requires_reauth" && (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Reauth Required
                        </>
                      )}
                    </Badge>
                  )}
                </div>

                {hasGmailConnected ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-sans">
                      {gmailConnection.email}
                    </p>
                    {gmailConnection.lastSyncedAt && (
                      <p className="text-xs text-muted-foreground font-sans">
                        Last scanned:{" "}
                        {formatDistanceToNow(gmailConnection.lastSyncedAt, { addSuffix: true })}
                      </p>
                    )}
                    {gmailConnection.errorMessage && (
                      <p className="text-xs text-red-600 font-sans">
                        {gmailConnection.errorMessage}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground font-sans">
                    Automatically detect subscriptions from email receipts
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {hasGmailConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnect(gmailConnection._id)}
                  className="font-sans w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              ) : requiresUpgrade ? (
                <Link href="/dashboard/upgrade" className="w-full sm:w-auto">
                  <Button variant="outline" className="font-sans w-full sm:w-auto">
                    <Lock className="h-4 w-4 mr-2" />
                    Upgrade to Connect
                  </Button>
                </Link>
              ) : !canAddConnection ? (
                <Button disabled className="font-sans w-full sm:w-auto">
                  <Lock className="h-4 w-4 mr-2" />
                  Limit Reached (1/1)
                </Button>
              ) : (
                <Button onClick={handleConnectGmail} className="font-sans w-full sm:w-auto">
                  <Mail className="h-4 w-4 mr-2" />
                  Connect Gmail
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Connection Limit Info */}
        {isAutomate && (
          <div className="bg-muted/30 border rounded-lg p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-sans">Email connections:</span>
              <span className="font-medium font-sans">
                {currentConnections} / {maxConnections} used
              </span>
            </div>
            {currentConnections >= maxConnections && (
              <p className="text-xs text-muted-foreground font-sans mt-2">
                Your Automate tier includes {maxConnections} email connection. Disconnect your current email to connect a different one.
              </p>
            )}
          </div>
        )}

        {/* Outlook Coming Soon */}
        <div className="border rounded-lg p-4 opacity-60">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="rounded-full bg-muted p-2">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                  <path d="M24 7.386L12.009 0 0 7.386l12.009 7.351L24 7.386z" fill="#0364B8"/>
                  <path d="M24 14.737L12.009 22.088 0 14.737l12.009-7.351L24 14.737z" fill="#0078D4"/>
                  <path d="M12.009 22.088L0 14.737V7.386l12.009 7.351v7.351z" fill="#0078D4" opacity=".7"/>
                  <path d="M24 14.737V7.386l-11.991 7.351v7.351L24 14.737z" fill="#0078D4" opacity=".5"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium font-sans">Outlook</h4>
                  <Badge variant="secondary" className="font-sans">
                    Coming Soon
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-sans">
                  Microsoft Outlook support coming soon
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-muted/50 border rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-muted-foreground font-sans">
              <p>
                <strong>Privacy:</strong> We only access receipt and invoice emails. We never read
                personal emails or store email content.
              </p>
              <p>
                <strong>Security:</strong> Your email credentials are encrypted and can be
                disconnected anytime.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
