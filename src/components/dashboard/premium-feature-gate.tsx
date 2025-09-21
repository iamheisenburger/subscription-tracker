"use client";

import { useUserTier } from "@/hooks/use-user-tier";

interface PremiumFeatureGateProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export function PremiumFeatureGate({ children, fallback }: PremiumFeatureGateProps) {
  const { isPremium, isLoading } = useUserTier();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isPremium ? <>{children}</> : <>{fallback}</>;
}
