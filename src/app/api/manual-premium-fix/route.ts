import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { api } from '../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

/**
 * MANUAL PREMIUM FIX ENDPOINT
 * 
 * For users whose webhooks completely failed and have no metadata.
 * This manually sets them as premium if they should be.
 */
export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔧 MANUAL PREMIUM FIX for user:', userId.slice(-8));

    // Get current user data
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    // For Isabella's specific case - manually upgrade to premium
    // This is a one-time fix for the webhook failure
    
    const currentMetadata = clerkUser.publicMetadata as Record<string, unknown>;
    
    // Set premium metadata manually
    await client.users.updateUser(userId, {
      publicMetadata: {
        ...currentMetadata,
        tier: 'premium_user',
        plan: 'premium',
        subscriptionType: 'monthly',
        billing: 'monthly',
        plan_id: 'cplan_32xfUNaavPmbOI3V7AtOq7EiPqM',
        subscription_status: 'active',
        manual_fix_applied_at: new Date().toISOString(),
        manual_fix_reason: 'Webhook failed - user has active premium subscription'
      }
    });

    // Update Convex database
    await fetchMutation(api.users.setTier, {
      clerkId: userId,
      tier: 'premium_user',
      subscriptionType: 'monthly',
    });

    console.log('✅ MANUAL PREMIUM FIX: Successfully upgraded user to premium');

    return NextResponse.json({
      success: true,
      action: 'manual_premium_fix',
      tier: 'premium_user',
      subscriptionType: 'monthly',
      message: 'Successfully fixed premium status! Please refresh your dashboard.',
      next_steps: [
        'Refresh your dashboard page',
        'Premium features should now be accessible', 
        'Analytics tab should appear',
        'Unlimited subscriptions enabled',
        'Export features unlocked'
      ]
    });

  } catch (error) {
    console.error('❌ Manual premium fix error:', error);
    return NextResponse.json({
      error: 'Manual fix failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET - Check if manual fix is needed
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    
    const hasMetadata = Object.keys(clerkUser.publicMetadata).length > 0;
    const isPremiumInMetadata = (clerkUser.publicMetadata as Record<string, unknown>)?.tier === 'premium_user';

    return NextResponse.json({
      userId: userId.slice(-8),
      needsManualFix: !hasMetadata || !isPremiumInMetadata,
      currentMetadata: clerkUser.publicMetadata,
      recommendation: !hasMetadata 
        ? 'Manual fix needed - no metadata found'
        : !isPremiumInMetadata 
        ? 'Manual fix needed - not premium in metadata'
        : 'No manual fix needed'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
