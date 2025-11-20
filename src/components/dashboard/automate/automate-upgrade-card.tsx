"use client";

import Link from "next/link";
import { Sparkles, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AutomateUpgradeCardProps {
  title?: string;
  description?: string;
  features?: string[];
  ctaLabel?: string;
  className?: string;
}

const DEFAULT_FEATURES = [
  "Gmail connection with auto receipt parsing",
  "Detection queue with quick approvals",
  "Duplicate + price change alerts",
];

export function AutomateUpgradeCard({
  title = "Available on Automate",
  description = "Connect Gmail, auto-detect subscriptions, and unlock proactive alerts with the Automate tier.",
  features = DEFAULT_FEATURES,
  ctaLabel = "Upgrade to Automate",
  className,
}: AutomateUpgradeCardProps) {
  return (
    <Card className={cn("border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10", className)}>
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="font-sans text-lg">{title}</CardTitle>
            <CardDescription className="font-sans text-sm">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <ul className="space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground font-sans">
              <ShieldCheck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard/upgrade">
            <Button className="font-sans">{ctaLabel}</Button>
          </Link>
          <p className="text-xs text-muted-foreground font-sans">
            Includes a 7-day free trial · Cancel anytime through Clerk
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


