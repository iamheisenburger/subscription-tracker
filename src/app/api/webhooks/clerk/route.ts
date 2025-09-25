import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { clerkClient } from '@clerk/nextjs/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';
import { detectTierFromClerkUser, logTierDetection } from '@/lib/tier-detection';

export const runtime = 'nodejs';

// Handle Clerk billing subscription events
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
      userId,
      status,
      planId,
      interval,
      subscriptionId: subscription.id
    });

    console.log('🔍 DETAILED PLAN CHECK:', {
      receivedPlanId: planId,
      expectedPlanId: process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID,
      planIdType: typeof planId,
      expectedType: typeof process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID,
      exactMatch: planId === process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID,
      environmentVariableSet: !!process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID
    });

    // Check if this is our premium plan
    const isPremiumPlan = planId === process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID;
    
    if (!isPremiumPlan) {
      console.log('❌ PLAN ID MISMATCH - Not upgrading user:', {
        receivedPlanId: planId,
        expectedPlanId: process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID,
        allSubscriptionData: subscription
      });
      return;
    }

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
        userId,
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

      // Update user metadata in Clerk for consistency
      const client = await clerkClient();
      await client.users.updateUser(userId, {
        publicMetadata: {
          plan: 'premium',
          tier: 'premium_user',
          subscriptionType,
          billing: subscriptionType,
          subscription_id: subscription.id,
          subscription_status: status,
          upgraded_at: new Date().toISOString()
        }
      });

      console.log('✅ User upgraded to premium successfully');

    } else if (isPaused) {
      console.log('⏸️ Subscription paused, maintaining premium access:', { userId, status });
      
      // For paused subscriptions, keep premium but update status
      const client = await clerkClient();
      await client.users.updateUser(userId, {
        publicMetadata: {
          plan: 'premium',
          tier: 'premium_user',
          subscription_status: 'paused',
          paused_at: new Date().toISOString()
        }
      });

    } else {
      console.log('⚠️ Subscription not active:', { status, userId });
      
      // If subscription is cancelled/inactive, downgrade user
      if (status === 'cancelled' || status === 'expired' || status === 'unpaid') {
        console.log('⬇️ Downgrading user to free:', { userId, status });
        
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

  // Enhanced debug logging to see what we're receiving
  console.log('🔍 Webhook received:', { 
    type, 
    userId: data.id, 
    publicMetadata: data.public_metadata,
    privateMetadata: data.private_metadata,
    externalAccounts: data.external_accounts,
    subscriptions: data.subscriptions 
  });

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

      // Handle ALL Clerk Billing subscription events
      case 'subscription.created':
        console.log('🎉 Subscription created:', { type, data });
        console.log('🔍 DEBUGGING - Environment PREMIUM_PLAN_ID:', process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID);
        console.log('🔍 DEBUGGING - Event plan_id:', (data as { plan_id?: string })?.plan_id);
        console.log('🔍 DEBUGGING - Event user_id:', (data as { user_id?: string })?.user_id);
        console.log('🔍 DEBUGGING - Event status:', (data as { status?: string })?.status);
        await handleSubscriptionEvent(data, 'created');
        break;

      case 'subscription.updated':
        console.log('🔄 Subscription updated:', { type, data });
        console.log('🔍 DEBUGGING - Environment PREMIUM_PLAN_ID:', process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID);
        console.log('🔍 DEBUGGING - Event plan_id:', (data as { plan_id?: string })?.plan_id);
        await handleSubscriptionEvent(data, 'updated');
        break;

      case 'subscription.active':
        console.log('✅ Subscription active:', { type, data });
        console.log('🔍 DEBUGGING - Environment PREMIUM_PLAN_ID:', process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID);
        console.log('🔍 DEBUGGING - Event plan_id:', (data as { plan_id?: string })?.plan_id);
        await handleSubscriptionEvent(data, 'active');
        break;

      case 'subscription.paused':
        console.log('⏸️ Subscription paused:', { type, data });
        await handleSubscriptionEvent(data, 'paused');
        break;

      case 'subscription.cancelled':
      case 'subscription.deleted':
        console.log('❌ Subscription cancelled:', { type, data });
        
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
        }
        break;

      // Handle subscription item events (for analytics and conversion tracking)
      case 'subscriptionitem.abandon':
        console.log('🚫 Subscription abandoned:', { type, data });
        // Track abandoned checkouts for analytics
        break;

      case 'subscriptionitem.active':
        console.log('🟢 Subscription item active:', { type, data });
        await handleSubscriptionEvent(data, 'item_active');
        break;

      case 'subscriptionitem.cancelled':
        console.log('🔴 Subscription item cancelled:', { type, data });
        await handleSubscriptionEvent(data, 'item_cancelled');
        break;

      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Error processing webhook', { status: 500 });
  }

  return NextResponse.json({ received: true });
}
