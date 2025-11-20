import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import type { UserTier } from "@/lib/feature-flags";

// Map database tier values to current UserTier type
function mapTierToCurrentType(dbTier: string | undefined): UserTier {
  if (!dbTier) return "free_user";

  // Map old "automate" to new "automate_1"
  if (dbTier === "automate") return "automate_1";

  // Map old "premium_user" / "premium" to the current Plus tier
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
  const isPlus = mappedTier === "plus";
  const isAutomate = mappedTier === "automate_1";
  const isPaidTier = isPlus || isAutomate;

  const subscriptionType = userData?.subscriptionType || null;
  const isMonthly = subscriptionType === "monthly" || subscriptionType === null;

  return {
    tier: mappedTier,
    isFree: mappedTier === "free_user",
    isPlus,
    isAutomate,
    isPaid: isPaidTier,
    isPremium: isPaidTier, // Backwards-compatible alias
    isLoading: userData === undefined,
    subscriptionLimit: userData?.subscriptionLimit ?? (isPaidTier ? -1 : 3),
    subscriptionType,
    isMonthlyPremium: isPaidTier && subscriptionType === "monthly",
    isAnnualPremium: isPaidTier && subscriptionType === "annual",
    // Treat unknown subscriptionType as monthly for upsell purposes
    isMonthlyOrUnknownPremium: isPaidTier && isMonthly,
  };
}
