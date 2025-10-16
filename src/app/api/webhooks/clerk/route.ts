import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { clerkClient } from '@clerk/nextjs/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';
import { detectTierFromClerkUser, logTierDetection } from '@/lib/tier-detection';

export const runtime = 'nodejs';

// Handle Clerk billing subscription events with intelligent plan detection
async function handleSubscriptionEvent(
  data: Record<string, unknown>, 
  eventType: 'created' | 'updated' | 'active' | 'paused' | 'item_active' | 'item_cancelled'
) {
  try {
    // Clerk billing subscription event structure
    const subscription = data as {
      id?: string;
      user_id?: string;
      status?: string;
      plan_id?: string;
      interval?: string;
      current_period_start?: number;
      current_period_end?: number;
      trial_start?: number;
      trial_end?: number;
      created_at?: number;
      updated_at?: number;
    };

    const userId = subscription.user_id;
    const status = subscription.status;
    const planId = subscription.plan_id;
    const interval = subscription.interval;

    if (!userId) {
      console.log('❌ No user_id in subscription event');
      return;
    }

    console.log('📦 Processing subscription event:', {
      eventType,
      userId: userId.slice(-8),
      status,
      planId,
      interval,
      subscriptionId: subscription.id
    });

    // **INTELLIGENT PREMIUM DETECTION** 
    // Instead of relying on hardcoded plan IDs, detect premium based on:
    // 1. Any paid plan with active status
    // 2. Non-free tier indicators
    // 3. Subscription cost/interval patterns
    
    const isPremiumSubscription = detectPremiumSubscription(subscription);
    
    if (!isPremiumSubscription) {
      console.log('ℹ️ Not a premium subscription (free/trial/unknown plan):', {
        planId,
        status,
        reasoning: 'Plan appears to be free tier or trial-only'
      });
      return;
    }

    console.log('✅ Premium subscription detected:', {
      planId,
      status,
      reasoning: 'Paid subscription with premium indicators'
    });

    // Determine if subscription should grant premium access
    const isActive = status === 'active' || status === 'trialing';
    const isPaused = status === 'paused' || eventType === 'paused';

    // Determine the correct tier based on plan ID (used in multiple branches)
    const detectedTier = planId ? getTierFromPlanId(planId) : 'plus';

    if (isActive && !isPaused) {
      // Determine subscription type
      let subscriptionType: 'monthly' | 'annual' = 'monthly';
      if (interval === 'year' || interval === 'annual') {
        subscriptionType = 'annual';
      }

      console.log('⬆️ Upgrading user to paid tier:', {
        userId: userId.slice(-8),
        tier: detectedTier,
        subscriptionType,
        status,
        eventType,
        planId
      });

      // Update user tier in Convex
      await fetchMutation(api.users.setTier, {
        clerkId: userId,
        tier: detectedTier,
        subscriptionType: subscriptionType,
      });

      // Update user metadata in Clerk for consistency
      const client = await clerkClient();
      await client.users.updateUser(userId, {
        publicMetadata: {
          plan: detectedTier,
          tier: detectedTier,
          subscriptionType,
          billing: subscriptionType,
          subscription_id: subscription.id,
          subscription_status: status,
          plan_id: planId, // Store actual plan ID for reference
          upgraded_at: new Date().toISOString()
        }
      });

      console.log(`✅ User upgraded to ${detectedTier} tier successfully`);

    } else if (isPaused) {
      console.log('⏸️ Subscription paused, maintaining paid tier access:', {
        userId: userId.slice(-8),
        status,
        tier: detectedTier
      });

      // For paused subscriptions, keep paid tier but update status
      const client = await clerkClient();
      await client.users.updateUser(userId, {
        publicMetadata: {
          plan: detectedTier,
          tier: detectedTier,
          subscription_status: 'paused',
          plan_id: planId,
          paused_at: new Date().toISOString()
        }
      });

    } else {
      console.log('⚠️ Subscription not active:', { status, userId: userId.slice(-8) });
      
      // If subscription is cancelled/inactive, downgrade user
      if (status === 'cancelled' || status === 'expired' || status === 'unpaid') {
        console.log('⬇️ Downgrading user to free:', { 
          userId: userId.slice(-8), 
          status 
        });
        
        await fetchMutation(api.users.setTier, {
          clerkId: userId,
          tier: 'free_user',
          subscriptionType: undefined,
        });

        // Update Clerk metadata
        const client = await clerkClient();
        await client.users.updateUser(userId, {
          publicMetadata: {
            plan: 'free',
            tier: 'free_user',
            subscription_status: status,
            plan_id: planId,
            downgraded_at: new Date().toISOString()
          }
        });
      }
    }

  } catch (error) {
    console.error('❌ Error handling subscription event:', error);
    throw error;
  }
}

/**
 * Determine tier from plan ID
 */
function getTierFromPlanId(planId: string): 'plus' | 'automate_1' {
  const plusPlanId = process.env.NEXT_PUBLIC_CLERK_PLUS_PLAN_ID;
  const automatePlanId = process.env.NEXT_PUBLIC_CLERK_AUTOMATE_PLAN_ID;

  if (planId === automatePlanId) return 'automate_1';
  if (planId === plusPlanId) return 'plus';

  // Default to plus for any other paid plan (backward compat)
  return 'plus';
}

/**
 * Intelligent Premium Subscription Detection
 *
 * Detects premium subscriptions without relying on hardcoded plan IDs.
 * This makes the system work for any Clerk billing configuration.
 */
function detectPremiumSubscription(subscription: {
  id?: string;
  plan_id?: string;
  status?: string;
  interval?: string;
  current_period_start?: number;
  current_period_end?: number;
  trial_start?: number;
  trial_end?: number;
}): boolean {
  const { plan_id, status, interval, current_period_start, current_period_end } = subscription;

  // Rule 1: Check against configured plan IDs (Plus and Automate)
  if (plan_id) {
    const plusPlanId = process.env.NEXT_PUBLIC_CLERK_PLUS_PLAN_ID;
    const automatePlanId = process.env.NEXT_PUBLIC_CLERK_AUTOMATE_PLAN_ID;
    const legacyPremiumId = process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID; // Backward compat

    if (plan_id === plusPlanId || plan_id === automatePlanId || plan_id === legacyPremiumId) {
      return true;
    }
  }

  // Rule 2: Any plan that's not explicitly free/trial-only
  if (plan_id) {
    // Common free plan patterns
    const freePlanPatterns = [
      'free', 'trial', 'test', 'demo', 'starter', 'basic'
    ];
    
    const planLower = plan_id.toLowerCase();
    const isFreePattern = freePlanPatterns.some(pattern => 
      planLower.includes(pattern)
    );
    
    if (!isFreePattern) {
      console.log('🎯 Premium detected by plan name pattern:', plan_id);
      return true;
    }
  }

  // Rule 3: Paid subscriptions with billing periods
  if (status === 'active' && interval && (current_period_start || current_period_end)) {
    // Has billing cycle = likely paid subscription
    console.log('🎯 Premium detected by billing cycle:', { interval, status });
    return true;
  }

  // Rule 4: Annual subscriptions are typically premium
  if (interval === 'year' || interval === 'annual') {
    console.log('🎯 Premium detected by annual interval');
    return true;
  }

  // Rule 5: If status is 'active' and not trial-only, likely premium
  if (status === 'active' && !subscription.trial_start) {
    console.log('🎯 Premium detected by active non-trial status');
    return true;
  }

  return false;
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to your environment variables');
  }

  // Get the headers
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: { data: Record<string, unknown>; type: string };

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as { data: Record<string, unknown>; type: string };
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new NextResponse('Error occurred', {
      status: 400,
    });
  }

  const { data, type } = evt;

  // Enhanced logging for subscription events
  if (type.includes('subscription')) {
    console.log('🔍 Subscription webhook received:', { 
      type, 
      userId: (data as { user_id?: string }).user_id?.slice(-8),
      planId: (data as { plan_id?: string }).plan_id,
      status: (data as { status?: string }).status,
      interval: (data as { interval?: string }).interval
    });
  }

  try {
    switch (type) {
      case 'user.created':
        await fetchMutation(api.users.createOrUpdateUser, {
          clerkId: data.id as string,
          email: (data.email_addresses as Array<{ email_address?: string }>)?.[0]?.email_address || "",
        });
        break;

      case 'user.updated':
        // Use centralized tier detection for user.updated events
        const clerkClient_updated = await clerkClient();
        const updatedUser = await clerkClient_updated.users.getUser(data.id as string);
        
        const tierResult = detectTierFromClerkUser(updatedUser);
        logTierDetection(data.id as string, tierResult, 'clerk_webhook_user_updated');
        
        // Update tier if we have medium or high confidence
        if (tierResult.confidence !== 'low') {
          await fetchMutation(api.users.setTier, {
            clerkId: data.id as string,
            tier: tierResult.tier,
            subscriptionType: tierResult.subscriptionType,
          });
          
          console.log(`✅ Webhook: Updated user to ${tierResult.tier} (${tierResult.confidence} confidence)`);
        } else {
          console.log(`ℹ️ Webhook: Low confidence tier detection, no update made`);
        }
        break;

      case 'organizationMembership.created':
        const orgData = data.organization as { slug?: string };
        const userData = data.public_user_data as { user_id?: string };
        const orgSlug = orgData?.slug;
        const userId = userData?.user_id;

        // If user joined paid organization, upgrade them
        if (orgSlug === 'plus' || orgSlug?.includes('plus')) {
          await fetchMutation(api.users.setTier, {
            clerkId: userId as string,
            tier: 'plus',
          });
        } else if (orgSlug === 'automate' || orgSlug?.includes('automate')) {
          await fetchMutation(api.users.setTier, {
            clerkId: userId as string,
            tier: 'automate_1',
          });
        }
        break;

      case 'organizationMembership.deleted':
        const deletedUserData = data.public_user_data as { user_id?: string };
        const deletedUserId = deletedUserData?.user_id;
        
        if (deletedUserId) {
          await fetchMutation(api.users.setTier, {
            clerkId: deletedUserId,
            tier: 'free_user',
          });
        }
        break;

      // Handle ALL Clerk Billing subscription events with intelligent detection
      case 'subscription.created':
        console.log('🎉 Subscription created');
        await handleSubscriptionEvent(data, 'created');
        break;

      case 'subscription.updated':
        console.log('🔄 Subscription updated');
        await handleSubscriptionEvent(data, 'updated');
        break;

      case 'subscription.active':
        console.log('✅ Subscription active');
        await handleSubscriptionEvent(data, 'active');
        break;

      case 'subscription.paused':
        console.log('⏸️ Subscription paused');
        await handleSubscriptionEvent(data, 'paused');
        break;

      case 'subscription.cancelled':
      case 'subscription.deleted':
        console.log('❌ Subscription cancelled');
        
        type CancelPayload = Record<string, unknown> & {
          user_id?: string;
          userId?: string;
          object?: { user_id?: string };
        };
        const dc = data as CancelPayload;
        const cancelledUserId = dc.user_id || dc.userId || dc.object?.user_id;
        if (cancelledUserId) {
          await fetchMutation(api.users.setTier, {
            clerkId: cancelledUserId as string,
            tier: 'free_user',
          });
          
          // Update metadata
          const client = await clerkClient();
          await client.users.updateUser(cancelledUserId as string, {
            publicMetadata: {
              plan: 'free',
              tier: 'free_user',
              subscription_status: 'cancelled',
              downgraded_at: new Date().toISOString()
            }
          });
        }
        break;

      // Handle subscription item events
      case 'subscriptionitem.abandon':
        console.log('🚫 Subscription abandoned');
        break;

      case 'subscriptionitem.active':
        console.log('🟢 Subscription item active');
        await handleSubscriptionEvent(data, 'item_active');
        break;

      case 'subscriptionitem.cancelled':
        console.log('🔴 Subscription item cancelled');
        await handleSubscriptionEvent(data, 'item_cancelled');
        break;

      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return new NextResponse('Error processing webhook', { status: 500 });
  }

  return NextResponse.json({ received: true });
}