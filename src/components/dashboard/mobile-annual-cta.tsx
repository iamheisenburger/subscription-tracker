"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, X } from "lucide-react";
import Link from "next/link";
import { useUserTier } from "@/hooks/use-user-tier";
import { useState } from "react";

export function MobileAnnualCTA() {
  const { isMonthlyPremium, isLoading } = useUserTier();
  const [dismissed, setDismissed] = useState(false);
  
  // Don't show anything while loading
  if (isLoading) {
    return null;
  }
  
  // Only show for monthly premium users
  if (!isMonthlyPremium) {
    return null;
  }
  
  // Don't show if user dismissed it
  if (dismissed) {
    return null;
  }
  
  return (
    <div className="block md:hidden"> {/* Only show on mobile */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 relative">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-2">
                <Crown className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground font-sans">
                  Save with Annual Billing
                </h3>
                <p className="text-xs text-muted-foreground font-sans">
                  Get 2 months free • $7.50/mo
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/dashboard/upgrade">
                <Button size="sm" className="h-8 text-xs font-sans">
                  Switch
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setDismissed(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
