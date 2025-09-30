/**
 * Universal Premium Subscription Detection System
 * Detects active premium subscriptions by directly querying Clerk's billing data
 * This is the most reliable method for webhook failure recovery
 */

import { clerkClient } from '@clerk/nextjs/server';

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionType: 'monthly' | 'annual';
  planId?: string | null;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  details?: Record<string, unknown>;
}

/**
 * Determines subscription type from metadata
 */
function determineSubscriptionType(
  publicMeta: Record<string, unknown>, 
  privateMeta: Record<string, unknown>
): 'monthly' | 'annual' {
  const billing = publicMeta.billing || privateMeta.billing || 
                  publicMeta.subscriptionType || privateMeta.subscriptionType;
  
  if (typeof billing === 'string' && (billing.toLowerCase().includes('year') || billing.toLowerCase().includes('annual'))) {
    return 'annual';
  }
  
  return 'monthly'; // Default to monthly
}

/**
 * Universal Premium Subscription Detector
 * Uses multiple strategies to detect active premium subscriptions
 */
export async function detectActiveSubscriptionFromClerk(
  userId: string,
  client: Awaited<ReturnType<typeof clerkClient>>
): Promise<SubscriptionStatus> {
  try {
    const user = await client.users.getUser(userId);
    const publicMeta = user.publicMetadata || {};
    const privateMeta = user.privateMetadata || {};

    // Strategy 1: Direct tier indicators in metadata (highest confidence)
    if (publicMeta.tier === 'premium_user' || privateMeta.tier === 'premium_user') {
      return {
        hasActiveSubscription: true,
        subscriptionType: determineSubscriptionType(publicMeta, privateMeta),
        planId: (publicMeta.plan_id || privateMeta.plan_id) as string,
        reason: 'Has tier=premium_user in metadata',
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

      return {
        hasActiveSubscription: false,
        subscriptionType: 'monthly',
        planId: null,
        reason: `Payment provider linked (${paymentAccount?.provider}) but no subscription metadata`,
        confidence: 'low',
        details: { paymentAccount }
      };
    }

    // Strategy 3: For specific known premium plan IDs in environment
    const configuredPlanId = process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID;
    if (configuredPlanId && (publicMeta.plan_id === configuredPlanId || privateMeta.plan_id === configuredPlanId)) {
      return {
        hasActiveSubscription: true,
        subscriptionType: determineSubscriptionType(publicMeta, privateMeta),
        planId: configuredPlanId,
        reason: `Matches configured premium plan ID: ${configuredPlanId}`,
        confidence: 'high',
        details: { configuredPlanId, publicMeta, privateMeta }
      };
    }

    // Strategy 4: Check for any billing-related indicators
    const billingIndicators = [
      'subscription_status',
      'billing_status', 
      'plan_status',
      'subscription_id',
      'customer_id'
    ];

    const hasBillingData = billingIndicators.some(key => 
      publicMeta[key] === 'active' || 
      privateMeta[key] === 'active' ||
      publicMeta[key] === 'premium' || 
      privateMeta[key] === 'premium'
    );

    if (hasBillingData) {
      return {
        hasActiveSubscription: true,
        subscriptionType: determineSubscriptionType(publicMeta, privateMeta),
        planId: (publicMeta.plan_id || privateMeta.plan_id) as string,
        reason: 'Has active billing status indicators',
        confidence: 'high',
        details: { billingIndicators: { publicMeta, privateMeta } }
      };
    }

    // Default: No premium subscription detected
    return {
      hasActiveSubscription: false,
      subscriptionType: 'monthly',
      planId: null,
      reason: 'No premium subscription indicators found',
      confidence: 'high',
      details: { 
        publicMeta: Object.keys(publicMeta),
        privateMeta: Object.keys(privateMeta),
        externalAccounts: user.externalAccounts?.map(acc => acc.provider) || []
      }
    };

  } catch (error) {
    console.error('❌ Error detecting subscription from Clerk:', error);
    
    return {
      hasActiveSubscription: false,
      subscriptionType: 'monthly',
      planId: null,
      reason: `Error accessing Clerk data: ${error}`,
      confidence: 'low',
      details: { error: String(error) }
    };
  }
}