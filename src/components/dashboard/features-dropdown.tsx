"use client";

/**
 * Features Dropdown Component
 * Discoverable menu showing all Automate features with availability status
 * Helps users understand what they have and what requires setup
 */

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles,
  TrendingUp,
  Bell,
  Calendar,
  Trash2,
  Plus,
  Download,
  Mail,
  Smartphone,
  Lock,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useUserTier } from "@/hooks/use-user-tier";
import { useBankConnections } from "@/hooks/use-bank-connections";
import { getPlanEntitlement } from "@/lib/plan-entitlements";
import { useState } from "react";

export function FeaturesDropdown() {
  const { tier } = useUserTier();
  const { activeConnectionsCount } = useBankConnections();
  const [open, setOpen] = useState(false);

  // Only show for Automate tier
  if (tier !== "automate_1") {
    return null;
  }

  const entitlements = getPlanEntitlement(tier);
  const hasBanks = activeConnectionsCount > 0;

  const handleConnectBank = () => {
    // Scroll to bank CTA card or open Plaid
    const bankCard = document.querySelector('[data-bank-cta]');
    if (bankCard) {
      bankCard.scrollIntoView({ behavior: 'smooth' });
    }
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="font-sans text-xs">
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Features
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="font-sans text-xs text-muted-foreground">
          YOUR AUTOMATE FEATURES
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Available Now */}
        <div className="px-2 py-1">
          <p className="text-xs font-medium font-sans mb-2 text-foreground">✓ Available Now</p>
          <div className="space-y-1">
            <FeatureItem
              icon={Plus}
              label="Add Manual Subscriptions"
              available={true}
              description="Unlimited manual entries"
            />
            <FeatureItem
              icon={Calendar}
              label="Calendar Export"
              available={true}
              description="Export renewals to .ics"
            />
            <FeatureItem
              icon={Trash2}
              label="Cancel Assistant"
              available={true}
              description="Step-by-step cancellation guides"
            />
            <FeatureItem
              icon={Download}
              label="CSV/PDF Export"
              available={true}
              description="Download your data"
            />
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* After Bank Connection */}
        <div className="px-2 py-1">
          <p className="text-xs font-medium font-sans mb-2 text-muted-foreground flex items-center gap-1">
            {hasBanks ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Lock className="h-3 w-3" />}
            {hasBanks ? 'Active Automation' : 'Requires Bank Connection'}
          </p>
          <div className="space-y-1">
            <FeatureItem
              icon={Sparkles}
              label="Auto Detection"
              available={hasBanks}
              description="Find subs from transactions"
            />
            <FeatureItem
              icon={TrendingUp}
              label="Price Tracking"
              available={hasBanks}
              description="Alert on price increases"
            />
            <FeatureItem
              icon={Bell}
              label="Duplicate Alerts"
              available={hasBanks}
              description="Catch duplicate charges"
            />
          </div>
        </div>

        {!hasBanks && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                onClick={handleConnectBank}
                size="sm"
                className="w-full font-sans text-xs"
              >
                Connect Bank to Unlock
              </Button>
            </div>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Coming Soon */}
        <div className="px-2 py-1">
          <p className="text-xs font-medium font-sans mb-2 text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Coming Soon
          </p>
          <div className="space-y-1">
            <FeatureItem
              icon={Mail}
              label="Email Receipt Parsing"
              available={false}
              description="Scan Gmail/Outlook receipts"
              comingSoon
            />
            <FeatureItem
              icon={Smartphone}
              label="SMS/Push Notifications"
              available={false}
              description="Multi-channel alerts"
              comingSoon
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface FeatureItemProps {
  icon: React.ElementType;
  label: string;
  available: boolean;
  description: string;
  comingSoon?: boolean;
}

function FeatureItem({ icon: Icon, label, available, description, comingSoon }: FeatureItemProps) {
  return (
    <div className={`flex items-start gap-2 p-2 rounded-md transition-colors ${
      available ? 'hover:bg-muted/50 cursor-default' : 'opacity-60'
    }`}>
      <div className={`rounded-full p-1.5 ${
        available ? 'bg-green-500/10' : comingSoon ? 'bg-muted' : 'bg-orange-500/10'
      }`}>
        <Icon className={`h-3 w-3 ${
          available ? 'text-green-600' : comingSoon ? 'text-muted-foreground' : 'text-orange-600'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium font-sans leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground font-sans">{description}</p>
      </div>
      {available && <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />}
      {!available && !comingSoon && <Lock className="h-3 w-3 text-orange-500 flex-shrink-0 mt-0.5" />}
    </div>
  );
}
