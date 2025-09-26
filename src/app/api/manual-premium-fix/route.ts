import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { api } from '../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';
import { detectActiveSubscriptionFromClerk } from '@/lib/clerk-billing-detection';

/**
 * UNIVERSAL WEBHOOK FAILURE RECOVERY SYSTEM
 * 
 * Automatically detects and fixes webhook failures for ANY user.
 * Checks Clerk billing API to determine actual subscription status.
 */
export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔧 WEBHOOK FAILURE RECOVERY for user:', userId.slice(-8));

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const currentMetadata = clerkUser.publicMetadata as Record<string, unknown>;

    // UNIVERSAL DETECTION: Check if user has active billing subscription
    const subscriptionStatus = await detectActiveSubscriptionFromClerk(userId, client);
    
    if (!subscriptionStatus.hasActiveSubscription) {
      return NextResponse.json({
        success: false,
        message: 'No active premium subscription found',
        details: subscriptionStatus.reason,
        recommendation: 'Please purchase a premium subscription first'
      });
    }

    // User has active subscription but missing metadata - fix it
    console.log('✅ Active subscription detected, applying metadata fix');

    await client.users.updateUser(userId, {
      publicMetadata: {
        ...currentMetadata,
        tier: 'premium_user',
        plan: 'premium',
        subscriptionType: subscriptionStatus.subscriptionType,
        billing: subscriptionStatus.subscriptionType,
        plan_id: subscriptionStatus.planId,
        subscription_status: 'active',
        webhook_recovery_applied_at: new Date().toISOString(),
        webhook_recovery_reason: 'Webhook failure detected and fixed automatically'
      }
    });

    // Update Convex database
    await fetchMutation(api.users.setTier, {
      clerkId: userId,
      tier: 'premium_user',
      subscriptionType: subscriptionStatus.subscriptionType,
    });

    console.log('✅ UNIVERSAL WEBHOOK RECOVERY: Successfully fixed user tier');

    return NextResponse.json({
      success: true,
      action: 'webhook_failure_recovery',
      tier: 'premium_user',
      subscriptionType: subscriptionStatus.subscriptionType,
      planId: subscriptionStatus.planId,
      message: 'Webhook failure automatically detected and fixed!',
      details: subscriptionStatus,
      next_steps: [
        'Refresh your dashboard page',
        'Premium features should now be accessible',
        'This fix works for all users with similar webhook issues'
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
