"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useRef } from "react";
import { detectTierFromUserResource, logTierDetection, validateTierDetectionEnvironment } from "@/lib/tier-detection";

export function UserSync() {
  const { user, isLoaded } = useUser();
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
  const setTier = useMutation(api.users.setTier);
  const initializeNotificationPreferences = useMutation(api.notifications.initializeNotificationPreferences);
  const syncInProgress = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user || syncInProgress.current) return;

    // Prevent concurrent sync attempts
    syncInProgress.current = true;

    const syncUser = async () => {
      try {
        console.log('🔄 Starting user sync for:', user.id);

        // Validate environment before proceeding
        const envCheck = validateTierDetectionEnvironment();
        if (!envCheck.valid) {
          console.error('❌ Environment validation failed:', envCheck.missing);
          return;
        }
        if (envCheck.warnings.length > 0) {
          console.warn('⚠️ Environment warnings:', envCheck.warnings);
        }

        // Ensure user exists in Convex
        await createOrUpdateUser({
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
        });

        // Use centralized tier detection (client-side version)
        const tierResult = detectTierFromUserResource(user);
        logTierDetection(user.id, tierResult, 'user_sync');

        // Update tier based on metadata detection
        // Webhooks now handle tier assignment automatically
        if (tierResult.confidence === 'high') {
          await setTier({ 
            clerkId: user.id, 
            tier: tierResult.tier,
            subscriptionType: tierResult.subscriptionType
          });
          console.log(`✅ Tier synced: ${tierResult.tier} (${tierResult.source})`);
        }

        // Initialize notification preferences for new users (idempotent)
        await initializeNotificationPreferences({ clerkId: user.id });

      } catch (error) {
        console.error("❌ Failed to sync user:", error);
      } finally {
        syncInProgress.current = false;
      }
    };

    // Debounce sync calls
    const timeoutId = setTimeout(syncUser, 100);
    return () => {
      clearTimeout(timeoutId);
      syncInProgress.current = false;
    };
  }, [isLoaded, user, createOrUpdateUser, setTier, initializeNotificationPreferences]);

  return null; // This component doesn't render anything
}