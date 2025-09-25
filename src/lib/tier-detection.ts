/**
 * Centralized Tier Detection Utility
 * 
 * Provides consistent, robust tier detection logic for SubWise app.
 * Handles multiple data sources and fallback mechanisms.
 */

import { User } from '@clerk/nextjs/server';
import { UserResource } from '@clerk/types';

export interface TierDetectionResult {
  tier: 'free_user' | 'premium_user';
  subscriptionType?: 'monthly' | 'annual';
  confidence: 'high' | 'medium' | 'low';
  source: string;
  debug?: Record<string, unknown>;
}

/**
 * Comprehensive tier detection from Clerk user data (server-side User)
 */
export function detectTierFromClerkUser(user: User): TierDetectionResult {
  const debug = {
    publicMetadata: user.publicMetadata,
    privateMetadata: user.privateMetadata,
    organizationMemberships: (user as any).organizationMemberships?.map((m: any) => ({
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

  if (publicMeta?.tier === 'premium_user' || publicMeta?.plan === 'premium') {
    const subscriptionType = determineSubscriptionType(
      publicMeta.subscriptionType,
      publicMeta.billing
    );
    
    return {
      tier: 'premium_user',
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
  const userWithOrgs = user as any;
  const premiumOrgMembership = userWithOrgs.organizationMemberships?.find(
    (membership: any) => 
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

  // 4. Check External Accounts (low confidence)
  const hasStripeAccount = user.externalAccounts?.some(
    account => account.provider === 'stripe'
  );

  if (hasStripeAccount) {
    return {
      tier: 'premium_user',
      subscriptionType: 'monthly', // Default when unclear
      confidence: 'low',
      source: 'clerk_external_accounts',
      debug
    };
  }

  // 5. Default to free tier
  return {
    tier: 'free_user',
    confidence: 'high',
    source: 'default_free',
    debug
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

  // Required variables
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    missing.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }
  if (!process.env.CLERK_SECRET_KEY) {
    missing.push('CLERK_SECRET_KEY');
  }
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    missing.push('NEXT_PUBLIC_CONVEX_URL');
  }

  // Optional but recommended variables
  if (!process.env.CLERK_WEBHOOK_SECRET) {
    warnings.push('CLERK_WEBHOOK_SECRET (webhooks may fail)');
  }
  if (!process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID) {
    warnings.push('NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID (premium plan detection may fail)');
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
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

  // Debug info in development
  if (process.env.NODE_ENV === 'development' && result.debug) {
    console.log('🔍 Debug info:', result.debug);
  }
}

/**
 * Tier detection for client-side UserResource (simplified version)
 * This version only checks metadata since client-side doesn't have all the server-side data
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

  // 1. Check Public Metadata (highest confidence for client-side)
  const publicMeta = user.publicMetadata as {
    plan?: string;
    tier?: string;
    subscriptionType?: string;
    billing?: string;
    subscription_id?: string;
    subscription_status?: string;
  } | undefined;

  if (publicMeta?.tier === 'premium_user' || publicMeta?.plan === 'premium') {
    const subscriptionType = determineSubscriptionType(
      publicMeta.subscriptionType,
      publicMeta.billing
    );
    
    return {
      tier: 'premium_user',
      subscriptionType,
      confidence: 'high',
      source: 'client_public_metadata',
      debug
    };
  }

  // 2. Check Organization Memberships
  const premiumOrgMembership = user.organizationMemberships?.find(
    membership => 
      membership.organization.slug === 'premium' || 
      membership.organization.name?.toLowerCase().includes('premium')
  );

  if (premiumOrgMembership) {
    return {
      tier: 'premium_user',
      subscriptionType: 'monthly', // Default when unclear
      confidence: 'medium',
      source: 'client_organization_membership',
      debug
    };
  }

  // 3. Default to free tier
  return {
    tier: 'free_user',
    confidence: 'high',
    source: 'client_default_free',
    debug
  };
}
