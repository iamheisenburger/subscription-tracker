import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

/**
 * POST /api/clerk/subscription-created
 * 
 * This endpoint is called by Clerk after a successful PricingTable checkout.
 * It manually triggers the tier upgrade since Clerk PricingTable doesn't 
 * automatically set metadata or send webhooks.
 * 
 * Configure in Clerk Dashboard:
 * Billing → Plans → Premium → Post-checkout webhook URL:
 * https://usesubwise.app/api/clerk/subscription-created
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the subscription details from the request body
    const body = await request.json();
    const { 
      subscription_id, 
      plan_id, 
      interval, 
      status,
      user_id 
    } = body;

    console.log('🎉 Clerk subscription created webhook:', {
      userId,
      user_id,
      subscription_id,
      plan_id,
      interval,
      status
    });

    // Verify this is actually a premium subscription
    const isPremiumPlan = plan_id === process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID;
    const isActive = status === 'active' || status === 'trialing';

    if (!isPremiumPlan || !isActive) {
      console.log('❌ Not a premium/active subscription, skipping upgrade');
      return NextResponse.json({ 
        success: false, 
        reason: 'Not premium or not active',
        plan_id,
        status 
      });
    }

    // Determine subscription type from interval
    let subscriptionType: 'monthly' | 'annual' = 'monthly';
    if (interval === 'year' || interval === 'annual') {
      subscriptionType = 'annual';
    }

    // Update user metadata in Clerk for consistency
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: {
        plan: 'premium',
        tier: 'premium_user',
        subscriptionType,
        billing: subscriptionType,
        subscription_id,
        upgraded_at: new Date().toISOString()
      }
    });

    // Upgrade user in Convex
    await fetchMutation(api.users.setTier, {
      clerkId: userId,
      tier: 'premium_user',
      subscriptionType: subscriptionType,
    });

    console.log('✅ Successfully upgraded user to premium:', {
      userId,
      subscriptionType,
      subscription_id
    });

    return NextResponse.json({
      success: true,
      tier: 'premium_user',
      subscriptionType,
      subscription_id,
      message: 'User upgraded to premium successfully'
    });

  } catch (error) {
    console.error('❌ Subscription creation webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: String(error)
      }, 
      { status: 500 }
    );
  }
}
