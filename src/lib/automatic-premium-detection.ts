/**
 * Automatic Premium Detection System
 * 
 * This system automatically detects premium users even when Clerk webhooks fail.
 * It runs multiple detection strategies to ensure no paying customer is left as "free".
 */

import { clerkClient } from '@clerk/nextjs/server';
import { fetchMutation } from 'convex/nextjs';
import { api } from '../../convex/_generated/api';
import { detectActiveSubscriptionFromClerk } from './clerk-billing-detection';

interface PremiumDetectionResult {
  isPremium: boolean;
  confidence: 'high' | 'medium' | 'low';
  source: string;
  subscriptionType?: 'monthly' | 'annual';
  details?: Record<string, unknown>;
}

/**
 * Multi-strategy premium detection for Clerk billing customers
 */
export async function detectPremiumFromClerkBilling(
  userId: string
): Promise<PremiumDetectionResult> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    // Strategy 1: Check for existing metadata (quick check)
    const publicMeta = user.publicMetadata as {
      plan?: string;
      tier?: string;
      subscriptionType?: string;
      subscription_id?: string;
      subscription_status?: string;
    } | undefined;

    if (publicMeta?.tier === 'premium_user' || publicMeta?.plan === 'premium') {
      return {
        isPremium: true,
        confidence: 'high',
        source: 'existing_metadata',
        subscriptionType: publicMeta.subscriptionType as 'monthly' | 'annual' || 'monthly'
      };
    }

    // Strategy 1.5: **CRITICAL FIX** - Use comprehensive Clerk billing detection
    // This catches users who paid but webhooks failed to update metadata
    try {
      const subscriptionStatus = await detectActiveSubscriptionFromClerk(userId, client);
      
      if (subscriptionStatus.hasActiveSubscription && subscriptionStatus.confidence !== 'low') {
        console.log('🎉 WEBHOOK FAILURE AUTO-DETECTED!', {
          userId: userId.slice(-8),
          reason: subscriptionStatus.reason,
          confidence: subscriptionStatus.confidence
        });
        
        return {
          isPremium: true,
          confidence: subscriptionStatus.confidence,
          source: 'clerk_billing_detection_auto_recovery',
          subscriptionType: subscriptionStatus.subscriptionType,
          details: {
            ...subscriptionStatus.details,
            webhookFailureDetected: true,
            autoRecoveryApplied: true
          }
        };
      }
    } catch (billingCheckError) {
      console.log('⚠️ Billing detection check failed:', billingCheckError);
    }

    // Strategy 2: Check for recent user creation and other indicators
    // If user was created very recently and has no metadata, they might be in the 
    // middle of the purchase flow - this is a fallback detection method
    const isVeryRecentUser = user.createdAt && 
      Date.now() - user.createdAt < (10 * 60 * 1000); // Within 10 minutes

    if (isVeryRecentUser) {
      // Check if user has a professional email domain or other premium indicators
      const email = user.emailAddresses?.[0]?.emailAddress;
      const hasBusinessEmail = email && (
        email.includes('@company.') || 
        email.includes('@corp.') ||
        email.includes('business.') ||
        !email.includes('@gmail.') && !email.includes('@yahoo.') && !email.includes('@hotmail.')
      );

      // Very recent user with business email - possible premium in progress
      if (hasBusinessEmail) {
        return {
          isPremium: false, // Don't auto-upgrade on this alone
          confidence: 'low',
          source: 'recent_business_user',
          details: {
            createdMinutesAgo: Math.round((Date.now() - user.createdAt) / (60 * 1000)),
            emailDomain: email?.split('@')[1]
          }
        };
      }
    }

    // Strategy 3: Check external accounts for payment providers
    const hasPaymentProvider = user.externalAccounts?.some(
      account => ['stripe', 'paypal', 'square'].includes(account.provider)
    );

    if (hasPaymentProvider) {
      return {
        isPremium: true,
        confidence: 'medium',
        source: 'payment_provider_connected',
        subscriptionType: 'monthly', // Default assumption
        details: {
          providers: user.externalAccounts?.map(acc => acc.provider)
        }
      };
    }

    // Strategy 4: Check organization memberships
    interface UserWithOrgs {
      organizationMemberships?: Array<{
        organization?: { slug?: string; name?: string };
      }>;
    }
    const userWithOrgs = user as UserWithOrgs;
    const premiumOrgMembership = userWithOrgs.organizationMemberships?.find(
      (membership: { organization?: { slug?: string; name?: string } }) => 
        membership.organization?.slug === 'premium' || 
        membership.organization?.name?.toLowerCase().includes('premium')
    );

    if (premiumOrgMembership) {
      return {
        isPremium: true,
        confidence: 'medium',
        source: 'premium_organization',
        subscriptionType: 'monthly', // Default assumption
        details: {
          organization: premiumOrgMembership.organization?.name
        }
      };
    }

    // Strategy 5: Recent user creation with specific email patterns (low confidence)
    const isRecentUser = user.createdAt && 
      Date.now() - user.createdAt < (7 * 24 * 60 * 60 * 1000); // Within 7 days
    
    // Check if user has a business email domain (common for premium users)
    const email = user.emailAddresses?.[0]?.emailAddress;
    const businessDomains = ['company.com', 'corp.com', 'business.com']; // Add real patterns
    const hasBusinessEmail = email && businessDomains.some(domain => email.includes(domain));

    if (isRecentUser && hasBusinessEmail) {
      return {
        isPremium: false, // Don't auto-upgrade on low confidence
        confidence: 'low',
        source: 'business_email_pattern',
        details: {
          email: email?.split('@')[1], // Domain only
          createdAt: user.createdAt
        }
      };
    }

    // No premium indicators found
    return {
      isPremium: false,
      confidence: 'high',
      source: 'no_premium_indicators'
    };

  } catch (error) {
    console.error('❌ Premium detection error:', error);
    return {
      isPremium: false,
      confidence: 'low',
      source: 'detection_error',
      details: { error: String(error) }
    };
  }
}

/**
 * Automatically upgrade user if premium is detected
 */
export async function autoUpgradeIfPremium(userId: string): Promise<boolean> {
  try {
    const detection = await detectPremiumFromClerkBilling(userId);
    
    console.log('🔍 Automatic premium detection result:', {
      userId: userId.slice(-8),
      isPremium: detection.isPremium,
      confidence: detection.confidence,
      source: detection.source
    });

    // Auto-upgrade on high or medium confidence detection
    // Medium is acceptable because billing detection is reliable
    if (detection.isPremium && (detection.confidence === 'high' || detection.confidence === 'medium')) {
      // Update Convex database
      await fetchMutation(api.users.setTier, {
        clerkId: userId,
        tier: 'premium_user',
        subscriptionType: detection.subscriptionType || 'monthly',
      });

      // Update Clerk metadata
      const client = await clerkClient();
      await client.users.updateUser(userId, {
        publicMetadata: {
          plan: 'premium',
          tier: 'premium_user',
          subscriptionType: detection.subscriptionType || 'monthly',
          billing: detection.subscriptionType || 'monthly',
          auto_detected_at: new Date().toISOString(),
          detection_source: detection.source,
          ...detection.details
        }
      });

      console.log('✅ Auto-upgraded user to premium:', {
        userId: userId.slice(-8),
        source: detection.source,
        confidence: detection.confidence
      });

      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Auto-upgrade error:', error);
    return false;
  }
}

/**
 * Batch check multiple users for premium status (for background processing)
 */
export async function batchDetectPremiumUsers(userIds: string[]): Promise<{
  upgraded: string[];
  checked: number;
  errors: string[];
}> {
  const results = {
    upgraded: [] as string[],
    checked: 0,
    errors: [] as string[]
  };

  for (const userId of userIds) {
    try {
      const wasUpgraded = await autoUpgradeIfPremium(userId);
      if (wasUpgraded) {
        results.upgraded.push(userId);
      }
      results.checked++;
    } catch (error) {
      results.errors.push(`${userId}: ${String(error)}`);
    }
  }

  return results;
}
