/**
 * Plan Entitlements Configuration
 * Defines tier limits and pricing for subscription plans
 */

import type { UserTier } from "./feature-flags";

export interface PlanEntitlement {
  tier: UserTier;
  displayName: string;
  // Email connection limits
  emailConnectionsIncluded: number; // Number of email accounts that can be connected
  // Profile & org limits
  profilesLimit: number;
  seatsIncluded: number; // For teams
  seatOveragePrice: number; // Price per additional seat ($/mo)
  // Feature access
  canParseEmails: boolean;
  canUseCancelAssistant: boolean;
  canExportCSV: boolean;
  canExportPDF: boolean;
  canExportAPI: boolean;
  canUseSMSAlerts: boolean;
  canUsePushAlerts: boolean;
  customReminderDays: boolean;
  advancedAnalytics: boolean;
  priceChangeAlerts: boolean;
  duplicateChargeAlerts: boolean;
  // Subscription limits
  manualSubscriptionLimit: number; // -1 = unlimited
  // Support
  supportLevel: "community" | "email" | "priority_email" | "chat";
}

export const PLAN_ENTITLEMENTS: Record<UserTier, PlanEntitlement> = {
  free_user: {
    tier: "free_user",
    displayName: "Free - Track",
    // Email connections
    emailConnectionsIncluded: 0,
    // Profiles
    profilesLimit: 1,
    seatsIncluded: 1,
    seatOveragePrice: 0,
    // Features
    canParseEmails: false,
    canUseCancelAssistant: false,
    canExportCSV: false,
    canExportPDF: false,
    canExportAPI: false,
    canUseSMSAlerts: false,
    canUsePushAlerts: false,
    customReminderDays: false,
    advancedAnalytics: false,
    priceChangeAlerts: false,
    duplicateChargeAlerts: false,
    // Limits
    manualSubscriptionLimit: 3,
    // Support
    supportLevel: "community",
  },

  // Legacy premium tier (maps to Plus)
  premium_user: {
    tier: "premium_user",
    displayName: "Plus (Legacy)",
    // Email connections
    emailConnectionsIncluded: 0,
    // Profiles
    profilesLimit: 1,
    seatsIncluded: 1,
    seatOveragePrice: 0,
    // Features
    canParseEmails: false,
    canUseCancelAssistant: false,
    canExportCSV: true,
    canExportPDF: true,
    canExportAPI: false,
    canUseSMSAlerts: false,
    canUsePushAlerts: true,
    customReminderDays: true,
    advancedAnalytics: true,
    priceChangeAlerts: true,
    duplicateChargeAlerts: false,
    // Limits
    manualSubscriptionLimit: -1, // unlimited
    // Support
    supportLevel: "priority_email",
  },

  plus: {
    tier: "plus",
    displayName: "Plus",
    // Email connections
    emailConnectionsIncluded: 0,
    // Profiles
    profilesLimit: 1,
    seatsIncluded: 1,
    seatOveragePrice: 0,
    // Features
    canParseEmails: false,
    canUseCancelAssistant: false,
    canExportCSV: true,
    canExportPDF: true,
    canExportAPI: false,
    canUseSMSAlerts: false,
    canUsePushAlerts: false,
    customReminderDays: true,
    advancedAnalytics: true,
    priceChangeAlerts: false, // Manual data only
    duplicateChargeAlerts: false,
    // Limits
    manualSubscriptionLimit: -1, // unlimited
    // Support
    supportLevel: "priority_email",
  },

  automate_1: {
    tier: "automate_1",
    displayName: "Automate",
    // Email connections
    emailConnectionsIncluded: 1,
    // Profiles
    profilesLimit: 1,
    seatsIncluded: 1,
    seatOveragePrice: 0,
    // Features
    canParseEmails: true,
    canUseCancelAssistant: true,
    canExportCSV: true,
    canExportPDF: true,
    canExportAPI: false,
    canUseSMSAlerts: true,
    canUsePushAlerts: true,
    customReminderDays: true,
    advancedAnalytics: true,
    priceChangeAlerts: true,
    duplicateChargeAlerts: true,
    // Limits
    manualSubscriptionLimit: -1, // unlimited
    // Support
    supportLevel: "priority_email",
  },

};

/**
 * Get plan entitlement for a tier
 */
export function getPlanEntitlement(tier: UserTier): PlanEntitlement {
  return PLAN_ENTITLEMENTS[tier];
}

/**
 * Check if user can add another email connection
 */
export function canAddEmailConnection(
  tier: UserTier,
  currentEmailConnections: number
): { allowed: boolean; requiresUpgrade: boolean; maxConnections: number } {
  const entitlement = getPlanEntitlement(tier);

  // Email parsing requires canParseEmails feature
  if (!entitlement.canParseEmails) {
    return {
      allowed: false,
      requiresUpgrade: true,
      maxConnections: 0,
    };
  }

  const maxConnections = entitlement.emailConnectionsIncluded;

  if (currentEmailConnections < maxConnections) {
    return {
      allowed: true,
      requiresUpgrade: false,
      maxConnections,
    };
  }

  return {
    allowed: false,
    requiresUpgrade: false, // Already on correct tier, just hit limit
    maxConnections,
  };
}

/**
 * Get tier by string (case-insensitive)
 */
export function getTierFromString(tierStr: string): UserTier {
  const normalized = tierStr.toLowerCase();
  switch (normalized) {
    case "free":
    case "free_user":
      return "free_user";
    case "premium":
    case "premium_user":
      return "premium_user";
    case "plus":
      return "plus";
    case "automate":
    case "automate_1":
      return "automate_1";
    default:
      return "free_user";
  }
}

/**
 * Pricing information for display
 */
export interface PricingInfo {
  tier: UserTier;
  displayName: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  cta: string;
}

// Pricing matching mobile app: $4/mo or $40/yr for Plus
export const PRICING_INFO: Record<UserTier, PricingInfo> = {
  free_user: {
    tier: "free_user",
    displayName: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "Up to 3 subscriptions",
      "Basic renewal reminders",
      "Currency selection",
      "Community support",
    ],
    cta: "Get Started",
  },
  premium_user: {
    tier: "premium_user",
    displayName: "Plus (Legacy)",
    monthlyPrice: 4,
    annualPrice: 40,
    features: [
      "Unlimited subscriptions",
      "Budget tracking & alerts",
      "Advanced analytics",
      "CSV & JSON export",
      "Custom reminder timing",
    ],
    cta: "Upgrade to Plus",
  },
  plus: {
    tier: "plus",
    displayName: "Plus",
    monthlyPrice: 4,
    annualPrice: 40,
    features: [
      "Unlimited subscriptions",
      "Budget tracking & alerts",
      "Advanced analytics dashboard",
      "CSV & JSON export",
      "Custom reminder timing",
      "Priority support",
    ],
    cta: "Upgrade to Plus",
  },
  automate_1: {
    tier: "automate_1",
    displayName: "Automate",
    monthlyPrice: 9,
    annualPrice: 78,
    features: [
      "Everything in Plus",
      "1 Gmail connection",
      "Auto subscription detection",
      "Email receipt parsing",
      "Price change alerts",
    ],
    cta: "Upgrade to Automate",
  },
};
