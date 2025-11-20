"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

/**
 * AutoTierSync - Silent tier reconciliation component
 *
 * Runs once on dashboard mount to check if Convex tier matches Clerk status.
 * If user exists in Clerk but shows as free_user in Convex, attempts sync.
 *
 * IMPORTANT: This component is designed to work alongside UserSync.
 * UserSync handles initial user creation and high-confidence premium detection.
 * AutoTierSync provides a safety net for cases where webhooks fail or are delayed.
 */
export function AutoTierSync() {
  const { user, isLoaded } = useUser();
  const userData = useQuery(
    api.users.getUserByClerkId, 
    user?.id ? { clerkId: user.id } : "skip"
  );
  const syncAttempted = useRef(false);

  useEffect(() => {
    // Prevent multiple sync attempts
    if (syncAttempted.current) return;

    // Only run if:
    // 1. Clerk user is loaded and exists
    // 2. Convex user data is loaded and exists
    // 3. Convex shows free_user (potential sync needed)
    if (
      isLoaded && 
      user?.id && 
      userData && 
      userData.tier === "free_user"
    ) {
      syncAttempted.current = true;

      // Add delay to avoid race conditions with UserSync
      const timeoutId = setTimeout(async () => {
        try {
          console.log('🔍 AutoTierSync: Checking if sync needed for user');
          const response = await fetch('/api/sync/tier', { method: 'POST' });
          const result = await response.json();
          if (result.success && result.tier === 'plus') {
            console.log('✅ AutoTierSync: Upgraded user to Plus tier');
            setTimeout(() => { window.location.reload(); }, 1000);
          } else if (!result.success && result.confidence === 'low') {
            console.log('ℹ️ AutoTierSync: User confirmed as free tier');
          } else {
            console.log('ℹ️ AutoTierSync: No tier change needed');
          }
        } catch (error) {
          console.log('AutoTierSync failed (silent):', error);
        }
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [isLoaded, user?.id, userData]);

  // This component renders nothing - it's purely functional
  return null;
}
