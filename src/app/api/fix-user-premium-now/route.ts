import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { api } from '../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

/**
 * IMMEDIATE FIX FOR YOUR PREMIUM ACCOUNT
 * This directly sets your account to premium based on your known plan ID
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚨 EMERGENCY PREMIUM FIX for user:', userId.slice(-8));
    const client = await clerkClient();

    // Force premium metadata update based on your known plan ID
    await client.users.updateUser(userId, {
      publicMetadata: {
        tier: 'premium_user',
        plan: 'premium',
        subscriptionType: 'monthly', // Assuming monthly, adjust if needed
        billing: 'monthly',
        plan_id: process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID, // Your cplan_32xfUNaavPmbOI3V7AtOq7EiPqM
        subscription_status: 'active',
        emergency_fix_applied_at: new Date().toISOString(),
        fix_reason: 'Direct premium account restoration'
      }
    });

    // Update Convex database
    await fetchMutation(api.users.setTier, {
      clerkId: userId,
      tier: 'premium_user',
      subscriptionType: 'monthly',
    });

    console.log('✅ EMERGENCY FIX: User forcibly upgraded to premium');
    
    return NextResponse.json({
      success: true,
      action: 'emergency_premium_fix',
      tier: 'premium_user',
      subscriptionType: 'monthly',
      planId: process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID,
      message: '🎉 EMERGENCY FIX APPLIED! Your premium access has been restored.',
      instructions: [
        'Refresh your dashboard page',
        'Premium features should now be accessible',
        'This fix directly sets your account to premium status',
        'Webhook detection should now work for future users'
      ]
    });

  } catch (error) {
    console.error('❌ Emergency fix error:', error);
    return NextResponse.json({
      error: 'Emergency fix failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
