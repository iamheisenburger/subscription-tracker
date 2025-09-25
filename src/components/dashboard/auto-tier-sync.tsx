"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

/**
 * AutoTierSync - Silent tier reconciliation component
 * 
 * Runs once on dashboard mount to check if Convex tier matches Clerk status.
 * If user exists in Clerk but shows as free_user in Convex, attempts sync.
 * 
 * This fixes the issue where:
 * - User upgrades via Clerk PricingTable
 * - Clerk doesn't set metadata properly  
 * - Webhook never gets triggered
 * - User stuck as free_user in Convex
 */
export function AutoTierSync() {
  const { user, isLoaded } = useUser();
  const userData = useQuery(
    api.users.getUserByClerkId, 
    user?.id ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    // Only run if:
    // 1. Clerk user is loaded and exists
    // 2. Convex user data is loaded
    // 3. Convex shows free_user (needs sync)
    if (
      isLoaded && 
      user?.id && 
      userData && 
      userData.tier === "free_user"
    ) {
      // Silent sync attempt - no UI feedback
      fetch('/api/sync/tier', { method: 'POST' })
        .then(response => response.json())
        .then(result => {
          if (result.success && result.tier === 'premium_user') {
            // Tier was updated - refresh to show premium features
            console.log('✅ Auto-synced to premium tier');
            window.location.reload();
          }
        })
        .catch(error => {
          // Silent fail - don't show errors to user
          console.log('Auto-sync failed (silent):', error);
        });
    }
  }, [isLoaded, user?.id, userData]);

  // This component renders nothing - it's purely functional
  return null;
}
