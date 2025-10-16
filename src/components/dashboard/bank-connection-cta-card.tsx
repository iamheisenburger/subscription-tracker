"use client";

/**
 * BankConnectionCTACard Component
 * Prominent onboarding card for Automate tier users to connect their first bank
 * Replaces upgrade banner when user has Automate but no bank connections
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Sparkles, TrendingUp, Bell, Shield } from "lucide-react";
import { PlaidLinkButton } from "./bank/plaid-link-button";
import { useUserTier } from "@/hooks/use-user-tier";
import { useBankConnections } from "@/hooks/use-bank-connections";

export function BankConnectionCTACard() {
  const { tier } = useUserTier();
  const { activeConnectionsCount, isLoading } = useBankConnections();

  const isAutomate = tier === "automate_1";
  const hasBankConnected = activeConnectionsCount > 0;

  // Only show for Automate tier users with no bank connections
  if (!isAutomate || hasBankConnected || isLoading) {
    return null;
  }

  const handleSuccess = () => {
    window.location.reload();
  };

  return (
    <Card
      data-bank-cta
      className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10"
    >
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Content */}
          <div className="flex items-start space-x-4 flex-1">
            <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-foreground font-sans mb-2">
                Connect Your Bank to Unlock Automate Features
              </h3>
              <p className="text-sm text-muted-foreground font-sans mb-4">
                You&apos;re on the Automate plan! Once you connect your bank, we&apos;ll unlock powerful automation features like smart detection, price tracking, and duplicate charge alerts. See what you&apos;ll get below.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-sans">Auto-detect subscriptions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-sans">Track price changes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <span className="font-sans">Duplicate charge alerts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-sans">Bank-grade security</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: CTA */}
          <div className="text-center lg:text-right">
            <div className="mb-3">
              <p className="text-sm font-medium text-foreground font-sans">
                Quick Setup
              </p>
              <p className="text-xs text-muted-foreground font-sans">
                Takes less than 2 minutes
              </p>
            </div>
            <PlaidLinkButton onSuccess={handleSuccess}>
              <Button size="lg" className="w-full sm:w-auto font-sans">
                <Building2 className="mr-2 h-5 w-5" />
                Connect Your Bank
              </Button>
            </PlaidLinkButton>
            <p className="text-xs text-muted-foreground font-sans mt-2">
              Secured by Plaid • Bank credentials never stored
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
