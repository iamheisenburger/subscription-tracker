"use client";

/**
 * Feature Badge Component
 * Shows contextual badges on subscription cards to indicate which Automate features are active
 * Helps users understand what automation is happening for each subscription
 */

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, TrendingUp, AlertCircle, Calendar } from "lucide-react";
import { type LucideIcon } from "lucide-react";

type FeatureBadgeType = "auto-detected" | "price-tracked" | "renewal-predicted" | "duplicate-alert";

interface FeatureBadgeConfig {
  icon: LucideIcon;
  label: string;
  tooltip: string;
  variant: "default" | "secondary" | "outline" | "destructive";
  className?: string;
}

const FEATURE_BADGE_CONFIG: Record<FeatureBadgeType, FeatureBadgeConfig> = {
  "auto-detected": {
    icon: Sparkles,
    label: "Auto-detected",
    tooltip: "Automatically discovered from Gmail receipts",
    variant: "secondary",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  "price-tracked": {
    icon: TrendingUp,
    label: "Price tracked",
    tooltip: "Price history tracked - you'll be notified of any changes when you update the cost",
    variant: "secondary",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  "renewal-predicted": {
    icon: Calendar,
    label: "Renewal predicted",
    tooltip: "Next billing date predicted from transaction patterns",
    variant: "secondary",
    className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  },
  "duplicate-alert": {
    icon: AlertCircle,
    label: "Duplicate protection",
    tooltip: "Watching for potential duplicate charges across similar subscriptions",
    variant: "secondary",
    className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  },
};

interface FeatureBadgeProps {
  type: FeatureBadgeType;
  confidence?: number; // Optional confidence score (0-1) to show in tooltip
  clickable?: boolean; // Whether badge should show hover state
}

export function FeatureBadge({ type, confidence, clickable = false }: FeatureBadgeProps) {
  const config = FEATURE_BADGE_CONFIG[type];
  const Icon = config.icon;

  const tooltipContent = confidence
    ? `${config.tooltip} (${Math.round(confidence * 100)}% confidence)`
    : config.tooltip;

  const clickableTooltipSuffix = clickable ? " • Click to view details" : "";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={config.variant}
            className={`font-sans text-xs flex items-center gap-1 ${config.className} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          >
            <Icon className="h-3 w-3" />
            <span>{config.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="font-sans max-w-xs">
          <p>{tooltipContent}{clickableTooltipSuffix}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface FeatureBadgesContainerProps {
  children: React.ReactNode;
}

/**
 * Container for multiple feature badges
 * Ensures consistent spacing and wrapping
 */
export function FeatureBadgesContainer({ children }: FeatureBadgesContainerProps) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {children}
    </div>
  );
}
