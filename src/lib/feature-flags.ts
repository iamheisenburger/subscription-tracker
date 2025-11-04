/**
 * Feature Flags Configuration
 * Controls gradual rollout of bank integration features
 */

export type FeatureFlag =
  | "email_parsing"
  | "cancel_assistant";

export type UserTier =
  | "free_user"
  | "premium_user"
  | "plus"
  | "automate_1";

export interface FeatureFlagConfig {
  enabled: boolean;
  description: string;
  rolloutPercentage: number; // 0-100
  allowedTiers: UserTier[];
}

/**
 * Feature flag definitions
 * Update these to control feature rollout
 */
export const FEATURE_FLAGS: Record<FeatureFlag, FeatureFlagConfig> = {
  email_parsing: {
    enabled: true,
    description: "Gmail/Outlook receipt parsing",
    rolloutPercentage: 100,
    allowedTiers: ["automate_1"],
  },
  cancel_assistant: {
    enabled: false, // Phase 2
    description: "Cancel subscription assistant",
    rolloutPercentage: 0,
    allowedTiers: ["automate_1"],
  },
};

/**
 * Check if a feature is enabled for a given tier
 */
export function isFeatureEnabled(
  flag: FeatureFlag,
  userTier: UserTier,
  userId?: string
): boolean {
  const config = FEATURE_FLAGS[flag];

  if (!config.enabled) return false;

  // Check tier allowlist
  if (!config.allowedTiers.includes(userTier)) return false;

  // Check rollout percentage (deterministic based on userId)
  if (config.rolloutPercentage < 100 && userId) {
    const hash = simpleHash(userId);
    const userPercentile = hash % 100;
    if (userPercentile >= config.rolloutPercentage) return false;
  }

  return true;
}

/**
 * Simple hash function for rollout percentage
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
