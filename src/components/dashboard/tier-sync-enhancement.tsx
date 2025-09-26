"use client";

import { useState } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUserTier } from "@/hooks/use-user-tier";

interface TierSyncEnhancementProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  showForPremiumUsers?: boolean;
}

/**
 * Enhanced Tier Sync Component
 * 
 * Provides intelligent tier synchronization for users experiencing
 * tier detection issues. Works for all users regardless of configuration.
 */
export function TierSyncEnhancement({ 
  variant = "outline", 
  size = "sm",
  className = "",
  showForPremiumUsers = false
}: TierSyncEnhancementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { isPremium, isLoading: tierLoading } = useUserTier();

  // Don't show for premium users unless explicitly requested
  if (!tierLoading && isPremium && !showForPremiumUsers) {
    return null;
  }

  const syncTier = async () => {
    setIsLoading(true);
    
    try {
      toast.info("Checking your subscription status...");
      
      const response = await fetch('/api/sync/tier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (result.tier === 'premium_user') {
          toast.success("✅ Premium subscription activated!", {
            description: `Welcome to ${result.subscriptionType || 'monthly'} premium`
          });
          
          // Reload to show premium features
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          toast.success("✅ Account status verified", {
            description: "You're on the free plan - upgrade to unlock premium features"
          });
        }
      } else {
        throw new Error(result.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Tier sync error:', error);
      toast.error("Unable to sync subscription status", {
        description: "Please try again or contact support if you have an active subscription"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={syncTier}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={`font-sans ${className}`}
    >
      {isLoading ? (
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" />
      )}
      {isLoading ? "Syncing..." : "Sync Status"}
    </Button>
  );
}

/**
 * Alert Banner for Users with Sync Issues
 * 
 * Shows a helpful banner for users who might have subscription sync issues
 */
export function TierSyncAlert() {
  const { isPremium, isLoading } = useUserTier();
  const [dismissed, setDismissed] = useState(false);

  // Only show for free users who might have purchased premium
  if (isLoading || isPremium || dismissed) {
    return null;
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-700 dark:text-yellow-200">
            <strong>Just upgraded to premium?</strong> If you purchased a premium subscription 
            but still see free tier limitations, your account might need a sync.
          </p>
          <div className="mt-3 flex space-x-3">
            <TierSyncEnhancement 
              variant="outline" 
              size="sm"
              className="bg-white dark:bg-gray-800 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            />
            <button
              onClick={() => setDismissed(true)}
              className="text-sm text-yellow-700 dark:text-yellow-200 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline Sync Button for Settings/Profile Pages
 */
export function InlineTierSync({ className = "" }: { className?: string }) {
  return (
    <div className={`text-center p-4 border rounded-lg bg-muted/20 ${className}`}>
      <p className="text-sm text-muted-foreground mb-3">
        Subscription not showing correctly? Sync your account status.
      </p>
      <TierSyncEnhancement 
        variant="default" 
        size="sm"
        showForPremiumUsers={true}
      />
    </div>
  );
}
