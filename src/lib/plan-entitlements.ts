/**
 * Plan Entitlements Configuration
 * Defines tier limits and pricing for subscription plans
 */

import type { UserTier } from "./feature-flags";

export interface PlanEntitlement {
  tier: UserTier;
  displayName: string;
  // Bank integration limits
  connectionsIncluded: number; // Number of free bank connections
  connectionOveragePrice: number; // Price per additional connection ($/mo)
  canLinkBanks: boolean; // Whether tier allows bank connections
  maxAccountsPerConnection: number; // Accounts per institution link
  syncFrequency: "manual" | "daily" | "hourly";
  maxHistoryMonths: number; // Transaction history window
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
    // Bank integration
    connectionsIncluded: 0,
    connectionOveragePrice: 0,
    canLinkBanks: false,
    maxAccountsPerConnection: 0,
    syncFrequency: "manual",
    maxHistoryMonths: 0,
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
    displayName: "Premium (Legacy)",
    // Bank integration
    connectionsIncluded: 0,
    connectionOveragePrice: 0,
    canLinkBanks: false,
    maxAccountsPerConnection: 0,
    syncFrequency: "manual",
    maxHistoryMonths: 0,
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
    // Bank integration
    connectionsIncluded: 0,
    connectionOveragePrice: 0,
    canLinkBanks: false,
    maxAccountsPerConnection: 0,
    syncFrequency: "manual",
    maxHistoryMonths: 0,
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
    // Bank integration
    connectionsIncluded: 1,
    connectionOveragePrice: 0, // No overages in v1
    canLinkBanks: true,
    maxAccountsPerConnection: 3,
    syncFrequency: "daily",
    maxHistoryMonths: 24,
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
 * Check if user can add another bank connection
 */
export function canAddBankConnection(
  tier: UserTier,
  currentConnections: number
): { allowed: boolean; requiresUpgrade: boolean; requiresPayment: boolean } {
  const entitlement = getPlanEntitlement(tier);

  if (!entitlement.canLinkBanks) {
    return {
      allowed: false,
      requiresUpgrade: true,
      requiresPayment: false,
    };
  }

  if (currentConnections < entitlement.connectionsIncluded) {
    return {
      allowed: true,
      requiresUpgrade: false,
      requiresPayment: false,
    };
  }

  // No overage in v1
  // Future: could allow overage with payment

  return {
    allowed: false,
    requiresUpgrade: true,
    requiresPayment: false,
  };
}

/**
 * Check if user can add another email connection
 * Email connections use the same limit as bank connections (connectionsIncluded)
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

  // Use same connection limit as bank connections
  const maxConnections = entitlement.connectionsIncluded;

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
 * Calculate overage cost for additional connections
 */
export function calculateConnectionOverage(
  tier: UserTier,
  currentConnections: number
): number {
  const entitlement = getPlanEntitlement(tier);
  const overage = Math.max(
    0,
    currentConnections - entitlement.connectionsIncluded
  );
  return overage * entitlement.connectionOveragePrice;
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

export const PRICING_INFO: Record<UserTier, PricingInfo> = {
  free_user: {
    tier: "free_user",
    displayName: "Free - Track",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "Up to 3 manual subscriptions",
      "Basic email reminders",
      "Simple spending overview",
      "Community support",
    ],
    cta: "Get Started",
  },
  premium_user: {
    tier: "premium_user",
    displayName: "Premium (Legacy)",
    monthlyPrice: 5,
    annualPrice: 42,
    features: [
      "Everything in Free",
      "Unlimited manual subscriptions",
      "CSV/PDF export",
      "Priority support",
    ],
    cta: "Upgrade",
  },
  plus: {
    tier: "plus",
    displayName: "Plus",
    monthlyPrice: 5,
    annualPrice: 42,
    features: [
      "Unlimited manual subscriptions",
      "Multi-currency analytics",
      "CSV/PDF export",
      "Custom categories & smart alerts",
      "Priority email support",
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
      "1 bank connection (up to 3 accounts)",
      "Auto subscription detection",
      "Price change & duplicate alerts",
      "Email receipt parsing",
      "Cancel Assistant (self-serve)",
      "Calendar export + Push/SMS",
      "Daily sync & renewal prediction",
    ],
    cta: "Upgrade to Automate",
  },
};
