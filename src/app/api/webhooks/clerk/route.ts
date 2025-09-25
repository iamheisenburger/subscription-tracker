import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { clerkClient } from '@clerk/nextjs/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export const runtime = 'nodejs';

// Handle Clerk billing subscription events
async function handleSubscriptionEvent(data: Record<string, unknown>, eventType: 'created' | 'updated') {
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

    // Check if this is our premium plan
    const isPremiumPlan = planId === process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID;
    
    if (!isPremiumPlan) {
      console.log('❌ Not our premium plan, ignoring:', planId);
      return;
    }

    // Determine if subscription is active
    const isActive = status === 'active' || status === 'trialing';
    
    if (isActive) {
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
        // Check multiple sources for premium status
        const metadata = data.public_metadata as { 
          plan?: string; 
          tier?: string; 
          subscriptionType?: string;
          billing?: string;
          subscription?: Record<string, unknown>;
        } | undefined;

        const privateMetadata = data.private_metadata as {
          plan?: string;
          tier?: string; 
          subscriptionType?: string;
          billing?: string;
          subscription?: Record<string, unknown>;
        } | undefined;
        
        // Enhanced premium detection - check multiple sources
        const hasPremiumInPublic = metadata?.plan === 'premium' || 
                                   metadata?.tier === 'premium_user' ||
                                   metadata?.tier === 'premium';
        
        const hasPremiumInPrivate = privateMetadata?.plan === 'premium' || 
                                    privateMetadata?.tier === 'premium_user' ||
                                    privateMetadata?.tier === 'premium';

        // Check for subscription information
        const hasSubscriptionData = metadata?.subscription || privateMetadata?.subscription;
        
        const isPremium = hasPremiumInPublic || hasPremiumInPrivate || hasSubscriptionData;
        
        console.log('🔍 Premium detection:', {
          hasPremiumInPublic,
          hasPremiumInPrivate, 
          hasSubscriptionData,
          isPremium,
          metadata,
          privateMetadata
        });
        
        if (isPremium) {
          // Determine subscription type from multiple sources
          let subscriptionType: "monthly" | "annual" | undefined;
          
          const typeFromPublic = metadata?.subscriptionType || metadata?.billing;
          const typeFromPrivate = privateMetadata?.subscriptionType || privateMetadata?.billing;
          
          if (typeFromPublic === 'annual' || typeFromPrivate === 'annual') {
            subscriptionType = 'annual';
          } else if (typeFromPublic === 'monthly' || typeFromPrivate === 'monthly') {
            subscriptionType = 'monthly';
          } else {
            // Default to monthly if unclear
            subscriptionType = 'monthly';
          }

          console.log('⬆️ Setting user to premium via webhook:', { subscriptionType });

          await fetchMutation(api.users.setTier, {
            clerkId: data.id as string,
            tier: 'premium_user',
            subscriptionType: subscriptionType,
          });
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

      // Handle Clerk Billing subscription events
      case 'subscription.created':
        console.log('🎉 Subscription created:', { type, data });
        await handleSubscriptionEvent(data, 'created');
        break;

      case 'subscription.updated':
        console.log('🔄 Subscription updated:', { type, data });
        await handleSubscriptionEvent(data, 'updated');
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

      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Error processing webhook', { status: 500 });
  }

  return NextResponse.json({ received: true });
}
