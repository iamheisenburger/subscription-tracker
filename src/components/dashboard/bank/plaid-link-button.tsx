"use client";

/**
 * PlaidLinkButton Component
 * Handles Plaid Link initialization and bank connection flow
 */

import { useState, useCallback, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PlaidLinkButtonProps {
  onSuccess?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function PlaidLinkButton({
  onSuccess,
  disabled,
  className,
  children = "Connect Bank",
}: PlaidLinkButtonProps) {
  const { user } = useUser();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch link token from API
  const fetchLinkToken = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch("/api/plaid/create-link-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create link token");
      }

      setLinkToken(data.linkToken);
    } catch (error) {
      console.error("Error fetching link token:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to initialize bank connection"
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Handle successful link
  const handleSuccess = useCallback(
    async (publicToken: string, metadata: Record<string, unknown>) => {
      try {
        setLoading(true);

        // Exchange public token for access token
        const response = await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicToken,
            institutionId: metadata.institution?.institution_id,
            institutionName: metadata.institution?.name,
            accounts: metadata.accounts,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to connect bank");
        }

        toast.success("Bank connected successfully!");
        onSuccess?.();
      } catch (error) {
        console.error("Error exchanging token:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to connect bank"
        );
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  // Handle exit
  const handleExit = useCallback((error: unknown, metadata: unknown) => {
    if (error) {
      console.error("Plaid Link error:", error, metadata);
      const errorObj = error as { error_code?: string };
      if (errorObj.error_code !== "INVALID_LINK_TOKEN") {
        toast.error("Bank connection cancelled or failed");
      }
    }
  }, []);

  // Initialize Plaid Link
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: handleSuccess,
    onExit: handleExit,
  });

  // Fetch link token on mount
  useEffect(() => {
    if (user && !linkToken && !loading) {
      fetchLinkToken();
    }
  }, [user, linkToken, loading, fetchLinkToken]);

  const handleClick = () => {
    if (ready && !loading) {
      open();
    } else if (!linkToken) {
      fetchLinkToken();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading || !ready}
      className={
        className ||
        "inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-sans hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      }
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
