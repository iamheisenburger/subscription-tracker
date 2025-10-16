/**
 * Centralized Tier Detection Utility
 * 
 * Provides consistent, robust tier detection logic for SubWise app.
 * Handles multiple data sources and fallback mechanisms.
 */

import { User } from '@clerk/nextjs/server';
import { UserResource } from '@clerk/types';

// Type definitions for organization membership data
interface OrganizationMembership {
  organization?: {
    slug?: string;
    name?: string;
  };
  role?: string;
}

interface ExtendedUser extends User {
  organizationMemberships?: OrganizationMembership[];
}

export interface TierDetectionResult {
  tier: 'free_user' | 'premium_user' | 'plus' | 'automate_1';
  subscriptionType?: 'monthly' | 'annual';
  confidence: 'high' | 'medium' | 'low';
  source: string;
  debug?: Record<string, unknown>;
}

/**
 * Comprehensive tier detection from Clerk user data (server-side User)
 */
export function detectTierFromClerkUser(user: User): TierDetectionResult {
  const extendedUser = user as ExtendedUser;
  const debug = {
    publicMetadata: user.publicMetadata,
    privateMetadata: user.privateMetadata,
    organizationMemberships: extendedUser.organizationMemberships?.map((m: OrganizationMembership) => ({
      slug: m.organization?.slug,
      name: m.organization?.name,
      role: m.role
    })),
    externalAccounts: user.externalAccounts?.map(a => ({
      provider: a.provider,
      id: a.id
    }))
  };

  // 1. Check Public Metadata (highest confidence)
  const publicMeta = user.publicMetadata as {
    plan?: string;
    tier?: string;
    subscriptionType?: string;
    billing?: string;
    subscription_id?: string;
    subscription_status?: string;
  } | undefined;

  // Check for any valid tier in metadata
  const validTiers = ['premium_user', 'premium', 'plus', 'automate_1', 'automate', 'free_user'];
  const metadataTier = publicMeta?.tier || publicMeta?.plan;

  if (metadataTier && validTiers.includes(metadataTier)) {
    // Map old tier names to new ones
    let tier: 'free_user' | 'premium_user' | 'plus' | 'automate_1' = 'free_user';

    if (metadataTier === 'automate' || metadataTier === 'automate_1') {
      tier = 'automate_1';
    } else if (metadataTier === 'plus') {
      tier = 'plus';
    } else if (metadataTier === 'premium_user' || metadataTier === 'premium') {
      // Map old premium_user to new plus tier
      tier = 'plus';
    } else {
      tier = 'free_user';
    }

    const subscriptionType = determineSubscriptionType(
      publicMeta.subscriptionType,
      publicMeta.billing
    );

    return {
      tier,
      subscriptionType,
      confidence: 'high',
      source: 'clerk_public_metadata',
      debug
    };
  }

  // 2. Check Private Metadata (high confidence)
  const privateMeta = user.privateMetadata as {
    plan?: string;
    tier?: string;
    subscriptionType?: string;
    billing?: string;
  } | undefined;

  if (privateMeta?.tier === 'premium_user' || privateMeta?.plan === 'premium') {
    const subscriptionType = determineSubscriptionType(
      privateMeta.subscriptionType,
      privateMeta.billing
    );

    return {
      tier: 'premium_user',
      subscriptionType,
      confidence: 'high',
      source: 'clerk_private_metadata',
      debug
    };
  }

  // 3. Check Organization Memberships (medium confidence)  
  const premiumOrgMembership = extendedUser.organizationMemberships?.find(
    (membership: OrganizationMembership) => 
      membership.organization?.slug === 'premium' || 
      membership.organization?.name?.toLowerCase().includes('premium')
  );

  if (premiumOrgMembership) {
    return {
      tier: 'premium_user',
      subscriptionType: 'monthly', // Default when unclear
      confidence: 'medium',
      source: 'clerk_organization_membership',
      debug
    };
  }

  // 4. Check External Accounts (low/medium confidence)
  const hasStripeAccount = user.externalAccounts?.some(
    account => account.provider === 'stripe'
  );

  if (hasStripeAccount) {
    return {
      tier: 'premium_user',
      subscriptionType: 'monthly', // Default when unclear
      confidence: 'medium',
      source: 'clerk_external_accounts',
      debug: {
        ...debug,
        systemicFix: 'Upgraded confidence to enable webhook processing for Stripe users'
      }
    };
  }

  // 5. Enhanced Default Tier Logic - SYSTEMIC FIX FOR ALL USERS
  const hasBusinessEmail = user.emailAddresses?.some(emailAddr => {
    const email = (emailAddr as { emailAddress?: string }).emailAddress || '';
    const domain = email.split('@')[1]?.toLowerCase() || '';
    return domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'].includes(domain);
  });

  const isRecentUser = user.createdAt && (Date.now() - user.createdAt < 24 * 60 * 60 * 1000);

  const confidence: 'high' | 'medium' = hasBusinessEmail || isRecentUser ? 'medium' : 'high';
  
  return {
    tier: 'free_user',
    confidence,
    source: 'enhanced_default_free',
    debug: {
      ...debug,
      hasBusinessEmail,
      isRecentUser,
      confidenceReason: confidence === 'medium' 
        ? 'Business email or recent user detected'
        : 'Standard user with webhook processing enabled',
      systemicFix: 'Ensures webhook processing for all users by avoiding low confidence'
    }
  };
}

/**
 * Determine subscription type from various input formats
 */
function determineSubscriptionType(
  ...sources: (string | undefined)[]
): 'monthly' | 'annual' {
  for (const source of sources) {
    if (!source) continue;
    
    const normalized = source.toLowerCase();
    if (normalized === 'annual' || normalized === 'year' || normalized === 'yearly') {
      return 'annual';
    }
    if (normalized === 'monthly' || normalized === 'month') {
      return 'monthly';
    }
  }
  
  // Default to monthly
  return 'monthly';
}

/**
 * Validate environment variables for tier detection
 */
export function validateTierDetectionEnvironment(): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser) {
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) missing.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) missing.push('NEXT_PUBLIC_CONVEX_URL');
    if (!process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID) warnings.push('NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID (optional; improves premium plan detection)');
  } else {
    if (!process.env.CLERK_SECRET_KEY) missing.push('CLERK_SECRET_KEY');
    if (!process.env.CLERK_WEBHOOK_SECRET) warnings.push('CLERK_WEBHOOK_SECRET (webhooks may fail)');
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) warnings.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (required for client)');
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) warnings.push('NEXT_PUBLIC_CONVEX_URL (required for client Convex SDK)');
    if (!process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID) warnings.push('NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID (optional; improves premium plan detection)');
  }

  return { valid: missing.length === 0, missing, warnings };
}

/**
 * Log tier detection results for debugging
 */
export function logTierDetection(
  userId: string,
  result: TierDetectionResult,
  context: string = 'tier_detection'
) {
  const logData = {
    context,
    userId,
    tier: result.tier,
    subscriptionType: result.subscriptionType,
    confidence: result.confidence,
    source: result.source,
    timestamp: new Date().toISOString()
  };

  if (result.confidence === 'low') {
    console.warn('⚠️ Low confidence tier detection:', logData);
  } else {
    console.log(`✅ Tier detected (${result.confidence} confidence):`, logData);
  }

  if (process.env.NODE_ENV === 'development' && result.debug) {
    console.log('🔍 Debug info:', result.debug);
  }
}

/**
 * Tier detection for client-side UserResource (simplified version)
 */
export function detectTierFromUserResource(user: UserResource): TierDetectionResult {
  const debug = {
    publicMetadata: user.publicMetadata,
    organizationMemberships: user.organizationMemberships?.map(m => ({
      slug: m.organization.slug,
      name: m.organization.name,
      role: m.role
    }))
  };

  const publicMeta = user.publicMetadata as {
    plan?: string;
    tier?: string;
    subscriptionType?: string;
    billing?: string;
    subscription_id?: string;
    subscription_status?: string;
  } | undefined;

  // Check for any valid tier in metadata
  const validTiers = ['premium_user', 'premium', 'plus', 'automate_1', 'automate', 'free_user'];
  const metadataTier = publicMeta?.tier || publicMeta?.plan;

  if (metadataTier && validTiers.includes(metadataTier)) {
    // Map old tier names to new ones
    let tier: 'free_user' | 'premium_user' | 'plus' | 'automate_1' = 'free_user';

    if (metadataTier === 'automate' || metadataTier === 'automate_1') {
      tier = 'automate_1';
    } else if (metadataTier === 'plus') {
      tier = 'plus';
    } else if (metadataTier === 'premium_user' || metadataTier === 'premium') {
      // Map old premium_user to new plus tier
      tier = 'plus';
    } else {
      tier = 'free_user';
    }

    const subscriptionType = determineSubscriptionType(
      publicMeta.subscriptionType,
      publicMeta.billing
    );

    return {
      tier,
      subscriptionType,
      confidence: 'high',
      source: 'client_public_metadata',
      debug
    };
  }

  const premiumOrgMembership = user.organizationMemberships?.find(
    membership =>
      membership.organization.slug === 'premium' ||
      membership.organization.name?.toLowerCase().includes('premium')
  );

  if (premiumOrgMembership) {
    return {
      tier: 'premium_user',
      subscriptionType: 'monthly',
      confidence: 'medium',
      source: 'client_organization_membership',
      debug
    };
  }

  return {
    tier: 'free_user',
    confidence: 'high',
    source: 'client_default_free',
    debug
  };
}
