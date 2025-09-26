/**
 * Universal Clerk Billing Detection System
 * 
 * Detects active subscriptions for any user by checking multiple Clerk indicators.
 * This works regardless of webhook failures or missing metadata.
 */

interface SubscriptionDetectionResult {
  hasActiveSubscription: boolean;
  subscriptionType: 'monthly' | 'annual';
  planId: string | null;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  details: Record<string, unknown>;
}

/**
 * Universal subscription detection from Clerk billing
 * Works for any user, not just specific cases
 */
export async function detectActiveSubscriptionFromClerk(
  userId: string,
  clerkClient: { users: { getUser: (id: string) => Promise<{ 
    id: string; 
    publicMetadata: Record<string, unknown>; 
    privateMetadata: Record<string, unknown>;
    externalAccounts?: Array<{ provider: string }>;
    organizationMemberships?: Array<{ 
      organization?: { slug?: string; name?: string }; 
      role?: string 
    }>;
    emailAddresses?: Array<{ emailAddress?: string }>;
    createdAt?: number;
  }> } }
): Promise<SubscriptionDetectionResult> {
  try {
    const user = await clerkClient.users.getUser(userId);
    
    // Strategy 1: Check for any existing subscription metadata
    const publicMeta = user.publicMetadata as Record<string, unknown>;
    const privateMeta = user.privateMetadata as Record<string, unknown>;
    
    // Check if user already has subscription indicators
    if (publicMeta.subscription_id || publicMeta.plan_id || privateMeta.subscription_id) {
      return {
        hasActiveSubscription: true,
        subscriptionType: determineSubscriptionType(publicMeta, privateMeta),
        planId: (publicMeta.plan_id || privateMeta.plan_id) as string,
        reason: 'Found subscription ID in metadata',
        confidence: 'high',
        details: { publicMeta, privateMeta }
      };
    }

    // Strategy 2: Check external accounts for payment providers
    const paymentProviders = ['stripe', 'paypal', 'square', 'paddle'];
    const hasPaymentAccount = user.externalAccounts?.some((account: { provider: string }) =>
      paymentProviders.includes(account.provider.toLowerCase())
    );

    if (hasPaymentAccount) {
      const paymentAccount = user.externalAccounts?.find((account: { provider: string }) =>
        paymentProviders.includes(account.provider.toLowerCase())
      );

      // Presence of a payment account is NOT sufficient to assert an active subscription
      return {
        hasActiveSubscription: false,
        subscriptionType: 'monthly',
        planId: null,
        reason: `Payment provider linked (${paymentAccount?.provider}) but no subscription metadata`,
        confidence: 'low',
        details: { paymentAccount }
      };
    }

    // Strategy 3: Check for premium organization memberships
    const userWithOrgs = user as { organizationMemberships?: Array<{ 
      organization?: { slug?: string; name?: string }; 
      role?: string 
    }> };
    const premiumOrgMembership = userWithOrgs.organizationMemberships?.find(
      (membership) => 
        membership.organization?.slug === 'premium' || 
        membership.organization?.name?.toLowerCase().includes('premium') ||
        membership.role === 'premium_member'
    );

    if (premiumOrgMembership) {
      // Org membership hints intent but is NOT authoritative for billing status
      return {
        hasActiveSubscription: false,
        subscriptionType: 'monthly',
        planId: null,
        reason: 'Premium organization membership without billing evidence',
        confidence: 'low',
        details: { premiumOrgMembership }
      };
    }

    // Strategy 4: Check user creation patterns that suggest premium intent
    const isVeryRecentUser = user.createdAt && 
      Date.now() - user.createdAt < (24 * 60 * 60 * 1000); // Within 24 hours

    const email = user.emailAddresses?.[0]?.emailAddress;
    const hasBusinessEmail = email && (
      !email.includes('@gmail.') && 
      !email.includes('@yahoo.') && 
      !email.includes('@hotmail.') &&
      !email.includes('@outlook.') &&
      email.includes('@') &&
      email.split('@')[1].includes('.')
    );

    // Recent user with business email might indicate premium signup
    if (isVeryRecentUser && hasBusinessEmail) {
      return {
        hasActiveSubscription: false, // Don't auto-upgrade on this alone
        subscriptionType: 'monthly',
        planId: null,
        reason: 'Recent business user - possible premium signup in progress',
        confidence: 'low',
        details: { 
          email: email.split('@')[1], // Domain only for privacy
          createdHoursAgo: user.createdAt ? Math.round((Date.now() - user.createdAt) / (60 * 60 * 1000)) : 0
        }
      };
    }

    // Strategy 5: For specific known premium plan IDs in environment
    const configuredPlanId = process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID;
    if (configuredPlanId && (publicMeta.plan_id === configuredPlanId || privateMeta.plan_id === configuredPlanId)) {
      return {
        hasActiveSubscription: true,
        subscriptionType: determineSubscriptionType(publicMeta, privateMeta),
        planId: configuredPlanId,
        reason: 'Plan ID matches configured premium plan',
        confidence: 'high',
        details: { configuredPlanId, metadata: { publicMeta, privateMeta } }
      };
    }

    // No premium subscription indicators found
    return {
      hasActiveSubscription: false,
      subscriptionType: 'monthly',
      planId: null,
      reason: 'No premium subscription indicators found',
      confidence: 'high',
      details: {
        checkedStrategies: [
          'metadata_subscription_ids',
          'external_payment_accounts',
          'premium_organizations',
          'user_creation_patterns',
          'configured_plan_ids'
        ]
      }
    };

  } catch (error) {
    return {
      hasActiveSubscription: false,
      subscriptionType: 'monthly',
      planId: null,
      reason: `Detection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      confidence: 'low',
      details: { error: String(error) }
    };
  }
}

/**
 * Determine subscription type from various metadata sources
 */
function determineSubscriptionType(
  publicMeta: Record<string, unknown>,
  privateMeta: Record<string, unknown>
): 'monthly' | 'annual' {
  const sources = [
    publicMeta.subscriptionType,
    publicMeta.billing,
    publicMeta.interval,
    privateMeta.subscriptionType,
    privateMeta.billing,
    privateMeta.interval
  ];

  for (const source of sources) {
    if (!source) continue;
    
    const normalized = String(source).toLowerCase();
    if (normalized === 'annual' || normalized === 'year' || normalized === 'yearly') {
      return 'annual';
    }
  }
  
  // Default to monthly
  return 'monthly';
}
