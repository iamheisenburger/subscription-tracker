import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";

export function useUserTier() {
  const { user } = useUser();
  const userData = useQuery(
    api.users.getUserByClerkId, 
    user?.id ? { clerkId: user.id } : "skip"
  );

  return {
    tier: userData?.tier || "free_user",
    isPremium: userData?.tier === "premium_user",
    isFree: userData?.tier === "free_user" || !userData?.tier,
    isLoading: userData === undefined,
    subscriptionLimit: userData?.subscriptionLimit || 3,
  };
}
