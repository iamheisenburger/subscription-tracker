"use client";

/**
 * Feature Preview Cards Component
 * Shows Automate users what features they'll unlock after connecting their bank
 * Addresses poor UX of hiding features until after connection
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Bell, Calendar, Trash2, LockKeyhole } from "lucide-react";
import { useUserTier } from "@/hooks/use-user-tier";
import { useBankConnections } from "@/hooks/use-bank-connections";

interface FeaturePreviewProps {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
}

function FeaturePreview({ icon: Icon, title, description, badge }: FeaturePreviewProps) {
  return (
    <div className="relative flex items-start space-x-3 p-4 rounded-lg border border-dashed border-muted bg-muted/20 hover:border-primary/30 transition-colors">
      <div className="rounded-full bg-muted p-2.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-medium font-sans text-muted-foreground">{title}</h4>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground/70 font-sans">{description}</p>
      </div>
      <div className="flex-shrink-0">
        <LockKeyhole className="h-3.5 w-3.5 text-muted-foreground/50" />
      </div>
    </div>
  );
}

export function FeaturePreviewCards() {
  const { tier } = useUserTier();
  const { activeConnectionsCount, isLoading } = useBankConnections();

  const isAutomate = tier === "automate_1";
  const hasBankConnected = activeConnectionsCount > 0;

  // Only show for Automate tier users with no bank connections
  if (!isAutomate || hasBankConnected || isLoading) {
    return null;
  }

  const features: FeaturePreviewProps[] = [
    {
      icon: Sparkles,
      title: "Smart Detection Queue",
      description: "AI-powered subscription detection from your bank transactions with confidence scores",
      badge: "Auto",
    },
    {
      icon: TrendingUp,
      title: "Price Change Tracking",
      description: "Get instant alerts when any subscription increases in price",
      badge: "Coming",
    },
    {
      icon: Bell,
      title: "Duplicate Charge Alerts",
      description: "Automatically detect and notify you of duplicate charges",
      badge: "Coming",
    },
    {
      icon: Calendar,
      title: "Calendar Export",
      description: "Export all renewal dates to your calendar with reminders",
      badge: "Available",
    },
    {
      icon: Trash2,
      title: "Cancel Assistant",
      description: "Step-by-step guides to cancel subscriptions from popular services",
      badge: "Available",
    },
  ];

  return (
    <Card className="border-muted">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold font-sans flex items-center gap-2">
              Your Automate Features
              <Badge variant="outline" className="font-sans font-normal">
                Unlocks after bank connection
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground font-sans mt-1">
              Connect your bank above to activate these powerful automation features
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <FeaturePreview key={index} {...feature} />
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs text-muted-foreground font-sans">
            <strong className="text-primary">What happens next:</strong> After you connect your bank, we&apos;ll sync your last 90 days of transactions and automatically detect recurring charges. You&apos;ll review each detection and approve what you want to track.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
