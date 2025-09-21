"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Zap, Lock } from "lucide-react";
import Link from "next/link";

interface TierGateProps {
  requiredTier: "premium_user";
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

const DefaultUpgradePrompt = () => (
  <Card className="border-dashed">
    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 rounded-full bg-yellow-50 p-3">
        <Crown className="h-8 w-8 text-yellow-600" />
      </div>
      <CardTitle className="mb-2">Premium Feature</CardTitle>
      <CardDescription className="mb-4 max-w-sm">
        This feature is only available with a Premium subscription. Upgrade to unlock advanced analytics, unlimited subscriptions, and more.
      </CardDescription>
      <div className="flex gap-2">
        <Link href="/pricing">
          <Button>
            <Zap className="mr-2 h-4 w-4" />
            Upgrade to Premium
          </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
);

// Hook to check user tier access
export function useTierAccess() {
  const { user } = useUser();
  const userProfile = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const isPremium = userProfile?.tier === "premium_user";
  const isFree = userProfile?.tier === "free_user";
  
  return {
    isPremium,
    isFree,
    tier: userProfile?.tier,
    loading: userProfile === undefined,
  };
}

export function TierGate({ requiredTier, children, fallback, className }: TierGateProps) {
  const { user } = useUser();
  const userProfile = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Loading state
  if (userProfile === undefined) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User not found or doesn't meet tier requirements
  const hasRequiredTier = userProfile?.tier === requiredTier;
  
  if (!hasRequiredTier) {
    return (
      <div className={className}>
        {fallback || <DefaultUpgradePrompt />}
      </div>
    );
  }

  // User has required tier, show content
  return <div className={className}>{children}</div>;
}


// Premium feature badge component
export function PremiumBadge({ className }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 ${className}`}>
      <Crown className="h-3 w-3" />
      Premium
    </div>
  );
}

// Lock icon for disabled features
export function LockedFeature({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
        <div className="flex items-center space-x-2 rounded-lg bg-gray-900/80 px-3 py-2 text-white">
          <Lock className="h-4 w-4" />
          <span className="text-sm font-medium">Premium Only</span>
        </div>
      </div>
    </div>
  );
}
