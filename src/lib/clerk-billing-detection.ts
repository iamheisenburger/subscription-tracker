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

    const publicMeta = user.publicMetadata as Record<string, unknown>;
    const privateMeta = user.privateMetadata as Record<string, unknown>;

    // Evidence 1: Subscription IDs/plan in metadata
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

    // Evidence 2: Configured premium plan ID matches
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

    // Hints (not sufficient): external payment accounts
    const paymentProviders = ['stripe', 'paypal', 'square', 'paddle'];
    const hasPaymentAccount = user.externalAccounts?.some(acc => paymentProviders.includes(acc.provider.toLowerCase()));
    if (hasPaymentAccount) {
      const paymentAccount = user.externalAccounts?.find(acc => paymentProviders.includes(acc.provider.toLowerCase()));
      return {
        hasActiveSubscription: false,
        subscriptionType: 'monthly',
        planId: null,
        reason: `Payment provider linked (${paymentAccount?.provider}) but no subscription metadata`,
        confidence: 'low',
        details: { paymentAccount }
      };
    }

    // Hints (not sufficient): premium org membership
    const userWithOrgs = user as { organizationMemberships?: Array<{ organization?: { slug?: string; name?: string }; role?: string }> };
    const premiumOrgMembership = userWithOrgs.organizationMemberships?.find(m =>
      m.organization?.slug === 'premium' || m.organization?.name?.toLowerCase().includes('premium') || m.role === 'premium_member'
    );
    if (premiumOrgMembership) {
      return {
        hasActiveSubscription: false,
        subscriptionType: 'monthly',
        planId: null,
        reason: 'Premium organization membership without billing evidence',
        confidence: 'low',
        details: { premiumOrgMembership }
      };
    }

    // Hints (not sufficient): recent user + business domain
    const isVeryRecentUser = user.createdAt && Date.now() - user.createdAt < (24 * 60 * 60 * 1000);
    const email = user.emailAddresses?.[0]?.emailAddress;
    const hasBusinessEmail = email && (
      !email.includes('@gmail.') && !email.includes('@yahoo.') && !email.includes('@hotmail.') && !email.includes('@outlook.')
    );
    if (isVeryRecentUser && hasBusinessEmail) {
      return {
        hasActiveSubscription: false,
        subscriptionType: 'monthly',
        planId: null,
        reason: 'Recent business user - possible premium signup in progress',
        confidence: 'low',
        details: { email: email.split('@')[1] }
      };
    }

    return {
      hasActiveSubscription: false,
      subscriptionType: 'monthly',
      planId: null,
      reason: 'No premium subscription indicators found',
      confidence: 'high',
      details: { checkedStrategies: ['metadata_ids', 'configured_plan_ids', 'payment_accounts', 'premium_org', 'recent_business'] }
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
    if (normalized === 'annual' || normalized === 'year' || normalized === 'yearly') return 'annual';
  }
  return 'monthly';
}