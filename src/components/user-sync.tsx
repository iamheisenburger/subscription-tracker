"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export function UserSync() {
  const { user, isLoaded } = useUser();
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
  const setTier = useMutation(api.users.setTier);

  useEffect(() => {
    if (!isLoaded || !user) return;

    // Ensure user exists
    createOrUpdateUser({
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
    }).catch((error) => {
      console.error("Failed to sync user:", error);
    });

    // If Clerk exposes plan info via public metadata or memberships, sync tier.
    type PublicMetadata = { plan?: string } | undefined;
    const meta = user.publicMetadata as PublicMetadata;
    const plan = meta?.plan;
    if (plan === 'premium_user') {
      setTier({ clerkId: user.id, tier: 'premium_user' }).catch(() => {});
    }
  }, [isLoaded, user, createOrUpdateUser, setTier]);

  return null; // This component doesn't render anything
}