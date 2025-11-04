"use client";

/**
 * Features Dropdown Component (STUB)
 * This component was bank-focused and has been disabled after removing bank integration
 */

import { useUserTier } from "@/hooks/use-user-tier";

export function FeaturesDropdown() {
  const { tier } = useUserTier();

  // Only show for Automate tier
  if (tier !== "automate_1") {
    return null;
  }

  // Disabled - bank integration removed
  return null;
}
