"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

/**
 * Shows success/error toasts for Gmail connection
 * Triggered by URL params: ?gmail_connected=true or ?gmail_error=xxx
 *
 * FIX: Force page reload to refetch all queries (connections, tier, etc.)
 * This prevents race condition where UI shows stale cached data
 */
export function GmailConnectionToast() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const gmailConnected = searchParams.get("gmail_connected");
    const gmailError = searchParams.get("gmail_error");

    // Handle SUCCESS
    if (gmailConnected === "true") {
      toast.success("Gmail Connected Successfully!", {
        description: "Scanning your inbox for subscriptions...",
        duration: 5000,
      });

      // CRITICAL FIX: Force full page reload to refetch all Convex queries
      // This ensures email connection, tier, and scan status are all up-to-date
      // Prevents "not connected" / "wrong tier" race condition
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000); // Small delay so toast is visible
    }

    // Handle ERRORS
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
          errorMessage = "You may have already connected this account. Try disconnecting first, then reconnect.";
          break;
        case "userinfo_failed":
          errorMessage = "Could not retrieve your email address. Please try again.";
          break;
        case "storage_failed":
          errorMessage = "Failed to save connection. Please try again.";
          break;
        case "unknown":
          errorMessage = "An unknown error occurred. Please try again.";
          break;
      }

      toast.error("Gmail Connection Failed", {
        description: errorMessage,
        duration: 7000, // Longer for errors
      });

      // Clean URL (remove error param)
      const url = new URL(window.location.href);
      url.searchParams.delete("gmail_error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  return null; // This component doesn't render anything
}
