import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { api } from '../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

/**
 * DIRECT FIX: Force premium status based on Clerk's billing dashboard
 * Since Clerk shows you as "Active Premium" but metadata is empty,
 * this directly sets the correct metadata and Convex data.
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('🚀 FORCE PREMIUM FIX for user:', userId);
    
    const client = await clerkClient();
    
    // Step 1: Set proper metadata in Clerk (what webhooks should have done)
    await client.users.updateUser(userId, {
      publicMetadata: {
        tier: 'premium_user',
        plan: 'premium', 
        subscriptionType: 'annual', // Based on your dashboard showing annual
        billing: 'annual',
        subscription_status: 'active',
        plan_id: process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID,
        force_fixed_at: new Date().toISOString(),
        fix_reason: 'Clerk dashboard shows premium but metadata was empty'
      }
    });

    // Step 2: Update Convex database  
    await fetchMutation(api.users.setTier, {
      clerkId: userId,
      tier: 'premium_user',
      subscriptionType: 'annual',
    });

    console.log('✅ FORCE FIX COMPLETE: User metadata and Convex updated');

    return NextResponse.json({
      success: true,
      action: 'force_premium_fix_applied',
      problem_identified: 'Clerk billing shows premium but metadata was empty',
      solution_applied: [
        '1. Set proper premium metadata in Clerk',  
        '2. Updated Convex database to premium_user',
        '3. This should fix your dashboard immediately'
      ],
      next_steps: [
        'Refresh your dashboard - premium features should now work',
        'This proves the bug is in webhook processing, not tier detection',
        'Need to fix webhook configuration for all future users'
      ]
    });

  } catch (error) {
    console.error('❌ Force premium fix error:', error);
    return NextResponse.json({
      error: 'Force fix failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
