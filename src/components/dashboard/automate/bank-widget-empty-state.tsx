"use client";

/**
 * Bank Widget Empty State Component - Optimized Compact Layout
 * Horizontal design that minimizes vertical space and adapts to all screen sizes
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Sparkles, TrendingUp, Bell } from "lucide-react";
import { PlaidLinkButton } from "../bank/plaid-link-button";

interface BankWidgetEmptyStateProps {
  onSuccess?: () => void;
}

export function BankWidgetEmptyState({ onSuccess }: BankWidgetEmptyStateProps) {
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      window.location.reload();
    }
  };

  return (
    <Card className="border-dashed">
      <div className="p-4 sm:p-6">
        {/* Desktop: Horizontal layout | Mobile: Stacked */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Icon + Title + Description */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="rounded-full bg-primary/10 p-2.5 flex-shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold font-sans text-base mb-1">Connected Banks</h3>
              <p className="text-sm text-muted-foreground font-sans mb-3">
                Link your bank to unlock automation features
              </p>

              {/* Features grid - responsive columns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span className="font-sans">Auto-detect subscriptions</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                  <span className="font-sans">Track price changes</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Bell className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
                  <span className="font-sans">Duplicate charge alerts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: CTA + Security note */}
          <div className="flex flex-col gap-2 lg:flex-shrink-0 lg:w-64">
            <PlaidLinkButton onSuccess={handleSuccess}>
              <Button size="default" className="w-full font-sans">
                <Building2 className="mr-2 h-4 w-4" />
                Connect Your Bank
              </Button>
            </PlaidLinkButton>
            <p className="text-center text-xs text-muted-foreground font-sans">
              Secured by Plaid • Takes &lt;2 min
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
