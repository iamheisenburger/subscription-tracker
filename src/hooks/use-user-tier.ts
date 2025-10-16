import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import type { UserTier } from "@/lib/feature-flags";

// Map database tier values to current UserTier type
function mapTierToCurrentType(dbTier: string | undefined): UserTier {
  if (!dbTier) return "free_user";

  // Map old "automate" to new "automate_1"
  if (dbTier === "automate") return "automate_1";

  // Map old "premium_user" to new "plus"
  if (dbTier === "premium_user" || dbTier === "premium") return "plus";

  // Filter out deprecated tiers (family, teams)
  if (dbTier === "family" || dbTier === "teams") {
    console.warn(`Deprecated tier detected: ${dbTier}, falling back to free_user`);
    return "free_user";
  }

  // Return as-is for valid tiers
  return dbTier as UserTier;
}

export function useUserTier() {
  const { user } = useUser();
  const userData = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const mappedTier = mapTierToCurrentType(userData?.tier);

  // Check if user has any paid tier (plus, automate_1, or legacy premium_user)
  const isPaidTier = userData?.tier === "plus" ||
                     userData?.tier === "premium_user" ||
                     userData?.tier === "automate_1";

  return {
    tier: mappedTier,
    isPremium: isPaidTier, // Now includes plus, automate_1, and legacy premium_user
    isFree: userData?.tier === "free_user" || !userData?.tier,
    isLoading: userData === undefined,
    subscriptionLimit: userData?.subscriptionLimit || 3,
    subscriptionType: userData?.subscriptionType || null,
    isMonthlyPremium: (userData?.tier === "plus" || userData?.tier === "premium_user") && userData?.subscriptionType === "monthly",
    isAnnualPremium: (userData?.tier === "plus" || userData?.tier === "premium_user") && userData?.subscriptionType === "annual",
    // Treat unknown subscriptionType as monthly for upsell purposes
    isMonthlyOrUnknownPremium:
      (userData?.tier === "plus" || userData?.tier === "premium_user") && (userData?.subscriptionType !== "annual"),
  };
}
