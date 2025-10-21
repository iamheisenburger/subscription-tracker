"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

/**
 * Shows success toast when Gmail is successfully connected
 * Triggered by ?gmail_connected=true query parameter
 *
 * FIX: Force page reload to refetch all queries (connections, tier, etc.)
 * This prevents race condition where UI shows stale cached data
 */
export function GmailConnectionToast() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const gmailConnected = searchParams.get("gmail_connected");

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
  }, [searchParams]);

  return null; // This component doesn't render anything
}
