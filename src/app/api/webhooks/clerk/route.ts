import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { clerkClient } from '@clerk/nextjs/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export const runtime = 'nodejs';
export const maxDuration = 30; // Increase timeout to 30 seconds

// Handle Clerk billing subscription events with intelligent plan detection
async function handleSubscriptionEvent(
  data: Record<string, unknown>, 
  eventType: 'created' | 'updated' | 'active' | 'paused' | 'item_active' | 'item_cancelled'
) {
  try {
    // Clerk billing subscription event structure
    const subscription = data as {
      id?: string;
      status?: string;
      plan_id?: string;
      interval?: string;
      payer?: {
        user_id?: string;
        email?: string;
        first_name?: string;
        last_name?: string;
      };
      items?: Array<{
        plan_id?: string;
        interval?: string;
        status?: string;
        plan?: {
          slug?: string;
        };
      }>;
      created_at?: number;
      updated_at?: number;
    };

    // Extract user_id from payer object
    const userId = subscription.payer?.user_id;
    
    // Extract plan info from either top-level (subscriptionItem events) or items array (subscription events)
    const planId = subscription.plan_id || subscription.items?.find(item => item.status === 'active' || item.status === 'trialing')?.plan_id;
    const interval = subscription.interval || subscription.items?.find(item => item.status === 'active' || item.status === 'trialing')?.interval;
    const status = subscription.status;

    if (!userId) {
      console.log('❌ No user_id in subscription event (no payer.user_id)');
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

    // **SIMPLE PLAN MATCHING**
    // Your Clerk PRODUCTION plan ID from dashboard: cplan_33DAB0ChNOO9L2vRGzokuOvc4dl
    const yourPremiumPlanId = 'cplan_33DAB0ChNOO9L2vRGzokuOvc4dl';
    const knownPremiumKeys = ['premium_user', 'premium', yourPremiumPlanId];
    const isPremiumPlan = planId && knownPremiumKeys.some(key => planId.includes(key));
    
    // CRITICAL: Only process premium plans, skip free plans
    if (!isPremiumPlan) {
      console.log(`ℹ️ Skipping non-premium plan: ${planId} (free_user plan)`);
      return;
    }

    console.log('✅ Processing premium subscription:', { planId, status });

    // Determine if subscription should grant premium access
    const isActive = status === 'active' || status === 'trialing';
    const isPaused = status === 'paused' || eventType === 'paused';
    
    if (isActive && !isPaused) {
      // Determine subscription type
      let subscriptionType: 'monthly' | 'annual' = 'monthly';
      if (interval === 'year' || interval === 'annual') {
        subscriptionType = 'annual';
      }

      console.log('⬆️ Upgrading user to premium:', {
        userId: userId.slice(-8),
        subscriptionType,
        status,
        eventType
      });

      // Update user to premium in Convex
      await fetchMutation(api.users.setTier, {
        clerkId: userId,
        tier: 'premium_user',
        subscriptionType: subscriptionType,
      });

      // Update user metadata in Clerk with proper structure
      const client = await clerkClient();
      await client.users.updateUser(userId, {
        publicMetadata: {
          plan: 'premium_user', // Match your Clerk plan key
          tier: 'premium_user',
          subscriptionType,
          billing: subscriptionType,
          subscription_id: subscription.id,
          subscription_status: status,
          plan_id: planId,
          upgraded_at: new Date().toISOString(),
          // Add feature flags matching your Clerk dashboard structure
          features: {
            unlimited_subscriptions: true,
            smart_alerts: true,
            custom_categories: true,
            advanced_notifications: true,
            spending_trends: true,
            export_csv_pdf: true,
            priority_support: true
          }
        }
      });

      console.log('✅ User upgraded to premium successfully');

    } else if (isPaused) {
      console.log('⏸️ Subscription paused, maintaining premium access:', { 
        userId: userId.slice(-8), 
        status 
      });
      
      // For paused subscriptions, keep premium but update status
      const client = await clerkClient();
      await client.users.updateUser(userId, {
        publicMetadata: {
          plan: 'premium',
          tier: 'premium_user',
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
 * Legacy detection function - kept for reference
 * Now using simple plan key matching instead
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
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

  // Rule 1: If we have the configured plan ID, use it
  if (plan_id && process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID) {
    if (plan_id === process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID) {
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
    
    // **EXTREME DEBUG: Log FULL payload**
    console.log('🚨 FULL WEBHOOK PAYLOAD:', JSON.stringify(data, null, 2));
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
        // Skip complex tier detection - metadata will be set by subscription events
        console.log(`ℹ️ User updated: ${(data.id as string).slice(-8)}`);
        break;

      case 'organizationMembership.created':
        const orgData = data.organization as { slug?: string };
        const userData = data.public_user_data as { user_id?: string };
        const orgSlug = orgData?.slug;
        const userId = userData?.user_id;
        
        // If user joined premium organization, upgrade them
        if (orgSlug === 'premium' || orgSlug?.includes('premium')) {
          await fetchMutation(api.users.setTier, {
            clerkId: userId as string,
            tier: 'premium_user',
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
      case 'subscriptionitem.created':
        console.log('✨ Subscription item created - upgrading user');
        await handleSubscriptionEvent(data, 'created');
        break;

      case 'subscriptionitem.abandon':
        console.log('🚫 Subscription abandoned');
        break;

      case 'subscriptionitem.active':
        console.log('🟢 Subscription item active');
        await handleSubscriptionEvent(data, 'item_active');
        break;

      case 'subscriptionitem.canceled':
      case 'subscriptionitem.cancelled':
        console.log('🔴 Subscription item cancelled - downgrading user');
        
        const cancelPayload = data as {
          payer?: { user_id?: string };
        };
        const cancelUserId = cancelPayload.payer?.user_id;
        
        if (cancelUserId) {
          await fetchMutation(api.users.setTier, {
            clerkId: cancelUserId,
            tier: 'free_user',
          });
          
          const client = await clerkClient();
          await client.users.updateUser(cancelUserId, {
            publicMetadata: {
              plan: 'free',
              tier: 'free_user',
              subscription_status: 'cancelled',
              downgraded_at: new Date().toISOString()
            }
          });
          console.log(`✅ User ${cancelUserId.slice(-8)} downgraded to free`);
        }
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