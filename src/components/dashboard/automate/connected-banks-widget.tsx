"use client";

/**
 * Connected Banks Widget Component
 * Shows bank connection status on dashboard for Automate users
 * Mobile-optimized with expandable details
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, RefreshCw, Settings, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useUserTier } from "@/hooks/use-user-tier";
import { useBankConnections } from "@/hooks/use-bank-connections";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface BankCardProps {
  bankName: string;
  accountCount: number;
  lastSynced: Date | null;
  status: "active" | "error" | "requires_reauth";
}

function BankCard({ bankName, accountCount, lastSynced, status }: BankCardProps) {
  const statusConfig = {
    active: {
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      label: "Connected",
    },
    error: {
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      label: "Error",
    },
    requires_reauth: {
      icon: AlertCircle,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      label: "Reauth Needed",
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        {/* Bank Icon */}
        <div className="rounded-full bg-primary/10 p-3">
          <Building2 className="h-5 w-5 text-primary" />
        </div>

        {/* Bank Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium font-sans text-base truncate">{bankName}</h4>
            <Badge variant="secondary" className={`flex items-center gap-1 ${config.bgColor}`}>
              <StatusIcon className={`h-3 w-3 ${config.color}`} />
              <span className="text-xs">{config.label}</span>
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
            <span>{accountCount} {accountCount === 1 ? "account" : "accounts"}</span>
            {lastSynced && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Synced {formatDistanceToNow(lastSynced, { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions - Hidden on mobile, shown on hover on desktop */}
      <div className="flex items-center gap-2 ml-2">
        {status === "active" && (
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex font-sans"
            title="Sync now"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="sm" className="font-sans">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function ConnectedBanksWidget() {
  const { tier } = useUserTier();
  const { activeConnectionsCount, isLoading } = useBankConnections();

  // Only show for Automate users
  if (tier !== "automate_1") {
    return null;
  }

  // Don't show if no banks connected
  if (!isLoading && activeConnectionsCount === 0) {
    return null;
  }

  // TODO: Get actual bank connections from Convex
  // For now, show placeholder when we know user has connections
  const mockBanks: BankCardProps[] = activeConnectionsCount > 0 ? [
    {
      bankName: "Chase Bank",
      accountCount: 3,
      lastSynced: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
      status: "active",
    },
  ] : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-2">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold font-sans">
                Connected Banks
              </CardTitle>
              <p className="text-sm text-muted-foreground font-sans mt-1">
                {activeConnectionsCount} of 1 bank connected • Auto-sync daily
              </p>
            </div>
          </div>
          <Link href="/dashboard/settings">
            <Button variant="outline" size="sm" className="font-sans hidden sm:flex">
              Manage
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : mockBanks.length > 0 ? (
            mockBanks.map((bank, index) => (
              <BankCard key={index} {...bank} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="font-sans">No banks connected</p>
            </div>
          )}
        </div>

        {/* Mobile: Show Manage button at bottom */}
        <Link href="/dashboard/settings">
          <Button variant="outline" size="sm" className="w-full mt-4 font-sans sm:hidden">
            Manage Banks
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
