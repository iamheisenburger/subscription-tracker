"use client";

/**
 * ConnectBankSection Component
 * Displays bank connection UI with tier gating and usage limits
 */

import { PlaidLinkButton } from "./plaid-link-button";
import { useBankConnections } from "@/hooks/use-bank-connections";
import { useUserTier } from "@/hooks/use-user-tier";
import { getPlanEntitlement } from "@/lib/plan-entitlements";
import Link from "next/link";
import { AlertCircle, Building2 } from "lucide-react";

export function ConnectBankSection() {
  const { tier } = useUserTier();
  const { activeConnectionsCount, isLoading } = useBankConnections();

  const entitlement = getPlanEntitlement(tier);
  const canConnect = entitlement.canLinkBanks;
  const atLimit = activeConnectionsCount >= entitlement.connectionsIncluded;

  // Refresh page after successful connection
  const handleSuccess = () => {
    window.location.reload();
  };

  // Free/Plus tier - show upgrade prompt
  if (!canConnect) {
    return (
      <div className="p-6 border border-dashed rounded-lg bg-card/50">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold font-sans mb-1">
              Bank Integration Available
            </h3>
            <p className="text-sm text-muted-foreground font-sans mb-4">
              Automatically detect subscriptions from your bank transactions.
              Connect your bank account and let SubWise find recurring charges
              for you.
            </p>
            <Link href="/dashboard/upgrade">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-sans hover:bg-primary/90 transition-colors">
                Upgrade to Automate
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Automate tier - show connection UI
  return (
    <div className="space-y-4">
      {/* Usage Meter */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium font-sans">Bank Connections</h3>
          <p className="text-sm text-muted-foreground font-sans">
            {isLoading ? (
              "Loading..."
            ) : (
              <>
                {activeConnectionsCount} of {entitlement.connectionsIncluded}{" "}
                bank{entitlement.connectionsIncluded !== 1 ? "s" : ""} connected
              </>
            )}
          </p>
        </div>
        {!atLimit && (
          <PlaidLinkButton onSuccess={handleSuccess}>
            Connect Bank
          </PlaidLinkButton>
        )}
      </div>

      {/* At Limit Warning */}
      {atLimit && (
        <div className="flex items-start gap-3 p-4 border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900 rounded-lg">
          <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-orange-900 dark:text-orange-300 font-sans">
              Connection Limit Reached
            </h4>
            <p className="text-sm text-orange-800 dark:text-orange-400 font-sans mt-1">
              You've connected {activeConnectionsCount} of{" "}
              {entitlement.connectionsIncluded} available bank
              {entitlement.connectionsIncluded !== 1 ? "s" : ""}. To add more
              banks, disconnect an existing connection first.
            </p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="text-sm text-muted-foreground font-sans bg-muted/50 p-4 rounded-lg">
        <p className="font-medium mb-2">What happens when you connect?</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>We sync transactions from the last 90 days</li>
          <li>SubWise automatically detects recurring charges</li>
          <li>You review and approve detected subscriptions</li>
          <li>Daily syncs keep everything up to date</li>
        </ul>
      </div>
    </div>
  );
}
