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

        // Only update tier if we have high confidence
        if (tierResult.confidence === 'high' && tierResult.tier === 'premium_user') {
          await setTier({ 
            clerkId: user.id, 
            tier: tierResult.tier,
            subscriptionType: tierResult.subscriptionType
          });
          console.log('✅ Tier updated to premium via UserSync');
        } else if (tierResult.tier === 'free_user') {
          // If client-side detection shows free user, try automatic server-side detection
          // This catches users who paid but webhooks failed
          console.log('🔍 Client shows free user, triggering automatic premium detection...');
          
          try {
            const autoDetectResponse = await fetch('/api/auto-detect-premium', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (autoDetectResponse.ok) {
              const result = await autoDetectResponse.json();
              if (result.upgraded) {
                console.log('✅ Automatic premium detection successful - refreshing page');
                setTimeout(() => window.location.reload(), 1000);
              }
            }
          } catch (error) {
            console.log('⚠️ Automatic premium detection failed:', error);
          }
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