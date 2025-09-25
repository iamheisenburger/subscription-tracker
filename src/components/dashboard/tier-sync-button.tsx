"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TierSyncButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function TierSyncButton({ 
  variant = "outline", 
  size = "sm",
  className = "" 
}: TierSyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const syncTier = async () => {
    setIsLoading(true);
    
    try {
      toast.info("Syncing your subscription status...");
      
      const response = await fetch('/api/sync/tier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`✅ Sync successful! You are on ${result.tier === 'premium_user' ? 'Premium' : 'Free'} tier`, {
          description: result.subscriptionType 
            ? `Subscription: ${result.subscriptionType}` 
            : undefined
        });
        
        // Reload the page to reflect changes
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Tier sync error:', error);
      toast.error("Failed to sync subscription status", {
        description: "Please try again or contact support if the issue persists"
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
