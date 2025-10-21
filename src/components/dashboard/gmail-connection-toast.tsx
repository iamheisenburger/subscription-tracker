"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

/**
 * Shows success toast when Gmail is successfully connected
 * Triggered by ?gmail_connected=true query parameter
 */
export function GmailConnectionToast() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const gmailConnected = searchParams.get("gmail_connected");

    if (gmailConnected === "true") {
      toast.success("Gmail Connected Successfully!", {
        description: "Your email is now being monitored for subscription receipts.",
        duration: 5000,
      });

      // Clean up URL by removing query param
      const url = new URL(window.location.href);
      url.searchParams.delete("gmail_connected");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  return null; // This component doesn't render anything
}
