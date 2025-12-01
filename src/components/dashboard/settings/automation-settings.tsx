"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserTier } from "@/hooks/use-user-tier";
import { AutomateUpgradeCard } from "../automate/automate-upgrade-card";
import { EmailConnectionSettings } from "./email-connection-settings";
import { FeaturesSection } from "./features-section";

export function AutomationSettings() {
  const { tier, isLoading } = useUserTier();
  const isAutomate = tier === "automate_1";

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 py-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!isAutomate) {
    return (
      <AutomateUpgradeCard
        title="Automation settings require Automate"
        description="Connect Gmail, enable auto-detection, and manage automation controls after upgrading."
        features={[
          "Scoped Gmail OAuth + secure storage",
          "Detection queue + duplicate protection alerts",
          "Automated reminders powered by parsed receipts",
        ]}
      />
    );
  }

  return (
    <div className="space-y-6">
      <EmailConnectionSettings />
      <FeaturesSection />
    </div>
  );
}

