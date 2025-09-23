"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export function UserSync() {
  const { user, isLoaded } = useUser();
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
  const setTier = useMutation(api.users.setTier);
  const initializeNotificationPreferences = useMutation(api.notifications.initializeNotificationPreferences);

  useEffect(() => {
    if (!isLoaded || !user) return;

    // Ensure user exists and sync tier from Clerk's organization memberships
    const syncUser = async () => {
      try {
        await createOrUpdateUser({
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
        });

        // Check if user has premium via organization membership or public metadata
        const hasPremiumMembership = user.organizationMemberships?.some(
          (membership) => membership.organization.slug === 'premium' || 
                        membership.organization.name?.toLowerCase().includes('premium')
        );
        
        type PublicMetadata = { plan?: string; tier?: string } | undefined;
        const meta = user.publicMetadata as PublicMetadata;
        const hasPremiumMetadata = meta?.plan === 'premium' || meta?.tier === 'premium_user';

        if (hasPremiumMembership || hasPremiumMetadata) {
          await setTier({ clerkId: user.id, tier: 'premium_user' });
        }

        // Initialize notification preferences for new users
        await initializeNotificationPreferences({ clerkId: user.id });
      } catch (error) {
        console.error("Failed to sync user:", error);
      }
    };

    syncUser();
  }, [isLoaded, user, createOrUpdateUser, setTier, initializeNotificationPreferences]);

  return null; // This component doesn't render anything
}