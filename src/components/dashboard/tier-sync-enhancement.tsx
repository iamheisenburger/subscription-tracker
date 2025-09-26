"use client";

import { useState } from "react";
import { RefreshCw, AlertTriangle, Bug } from "lucide-react";
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
  const [isDebugMode, setIsDebugMode] = useState(false);
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
          toast.warning("🔍 Still showing as free tier", {
            description: "Let's debug this - click the debug button"
          });
          setIsDebugMode(true);
        }
      } else {
        throw new Error(result.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Tier sync error:', error);
      toast.error("Sync failed - let's debug this", {
        description: "Click the debug button to see what's happening"
      });
      setIsDebugMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  const debugTier = async () => {
    setIsLoading(true);
    
    try {
      toast.info("Running comprehensive tier diagnosis...");
      
      const response = await fetch('/api/debug-tier-issue');
      const debugData = await response.json();
      
      console.log('🔍 TIER DEBUG DATA:', debugData);
      
      if (debugData.problemAnalysis?.issues?.length > 0) {
        // Show issues found
        toast.error("Issues found with tier detection", {
          description: `${debugData.problemAnalysis.issues.length} issues detected - check console for details`
        });
        
        // If we can fix it automatically, offer that
        if (debugData.manualAnalysis?.shouldBePremiumReasons?.length > 0) {
          toast.info("🔧 Found premium indicators - attempting fix...");
          
          // Try force fix
          const fixResponse = await fetch('/api/debug-tier-issue', { method: 'POST' });
          const fixResult = await fixResponse.json();
          
          if (fixResult.success && fixResult.action === 'force_upgraded') {
            toast.success("✅ Successfully fixed tier detection!", {
              description: fixResult.reason
            });
            
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } else {
            toast.warning("Could not auto-fix tier issue", {
              description: "Manual intervention may be needed"
            });
          }
        }
      } else {
        toast.success("No obvious issues found", {
          description: "Check console for detailed analysis"
        });
      }
      
    } catch (error) {
      console.error('Debug error:', error);
      toast.error("Debug failed", {
        description: "Check browser console for errors"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isDebugMode) {
    return (
      <div className="flex gap-2">
        <Button
          onClick={debugTier}
          disabled={isLoading}
          variant="destructive"
          size={size}
          className={`font-sans ${className}`}
        >
          {isLoading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Bug className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Debugging..." : "Debug Issue"}
        </Button>
        
        <Button
          onClick={() => setIsDebugMode(false)}
          variant="outline"
          size={size}
          className="font-sans"
        >
          Cancel
        </Button>
      </div>
    );
  }

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