"use client";

/**
 * Bank Widget Empty State Component
 * Actionable placeholder shown when no banks are connected
 * Explains benefits and provides clear path to connect first bank
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, TrendingUp, Bell, Shield, ArrowRight } from "lucide-react";
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
      <CardHeader>
        <div className="flex items-center space-x-2">
          <div className="rounded-full bg-primary/10 p-2">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-sans">Connected Banks</CardTitle>
            <CardDescription className="text-xs font-sans">
              Link your bank to unlock automation features
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium font-sans text-foreground">
              What you&apos;ll get with bank connection:
            </p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="rounded-full bg-green-500/10 p-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                </div>
                <span className="font-sans">Automatic subscription detection from transactions</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="rounded-full bg-orange-500/10 p-1">
                  <Bell className="h-3 w-3 text-orange-600" />
                </div>
                <span className="font-sans">Price change and duplicate charge alerts</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="rounded-full bg-blue-500/10 p-1">
                  <Shield className="h-3 w-3 text-blue-600" />
                </div>
                <span className="font-sans">Bank-grade security via Plaid</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground font-sans space-y-2">
            <p className="font-medium text-foreground">Quick & Secure Setup</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Connect via Plaid (bank-grade encryption)</li>
              <li>Select which accounts to monitor</li>
              <li>We&apos;ll scan transactions automatically</li>
            </ul>
          </div>

          <PlaidLinkButton onSuccess={handleSuccess}>
            <Button size="sm" className="w-full font-sans">
              <Building2 className="mr-2 h-4 w-4" />
              Connect Your First Bank
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </PlaidLinkButton>

          <p className="text-center text-xs text-muted-foreground font-sans">
            Takes less than 2 minutes • Your credentials are never stored
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
