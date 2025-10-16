import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';
import { detectTierFromClerkUser, logTierDetection } from '@/lib/tier-detection';
import { detectActiveSubscriptionFromClerk } from '@/lib/clerk-billing-detection';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Manual tier sync requested for user:', userId.slice(-8));

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    const tierResult = detectTierFromClerkUser(clerkUser);
    logTierDetection(userId, tierResult, 'manual_sync');

    if (tierResult.tier === 'free_user') {
      const hasEmptyMetadata = Object.keys(clerkUser.publicMetadata).length === 0;
      if (hasEmptyMetadata) {
        console.log('🔍 Empty metadata detected - checking for webhook failure');
        const subscriptionStatus = await detectActiveSubscriptionFromClerk(userId, client);
        if (subscriptionStatus.hasActiveSubscription && subscriptionStatus.confidence === 'high') {
          console.log('✅ Webhook failure detected - active subscription found, fixing automatically');
          await client.users.updateUser(userId, {
            publicMetadata: {
              tier: 'plus',
              plan: 'plus',
              subscriptionType: subscriptionStatus.subscriptionType,
              billing: subscriptionStatus.subscriptionType,
              plan_id: subscriptionStatus.planId,
              subscription_status: 'active',
              auto_recovery_applied_at: new Date().toISOString(),
              auto_recovery_reason: 'Webhook failure auto-detected and fixed during sync'
            }
          });
          await fetchMutation(api.users.setTier, {
            clerkId: userId,
            tier: 'plus',
            subscriptionType: subscriptionStatus.subscriptionType,
          });
          return NextResponse.json({
            success: true,
            tier: 'plus',
            subscriptionType: subscriptionStatus.subscriptionType,
            confidence: 'high',
            source: 'webhook_failure_recovery',
            message: '🎉 Webhook failure detected and automatically fixed! You now have Plus access.',
            recovery: {
              issue: 'Webhook failure - empty metadata despite active subscription',
              solution: 'Automatically restored premium status',
              details: subscriptionStatus
            }
          });
        }
      }
    }

    if (tierResult.confidence === 'high') {
      await fetchMutation(api.users.setTier, {
        clerkId: userId,
        tier: tierResult.tier,
        subscriptionType: tierResult.subscriptionType,
      });
      console.log(`✅ Tier sync successful: ${tierResult.tier} (${tierResult.confidence} confidence)`);
      return NextResponse.json({ 
        success: true, 
        tier: tierResult.tier,
        subscriptionType: tierResult.subscriptionType,
        confidence: tierResult.confidence,
        source: tierResult.source,
        message: tierResult.tier !== 'free_user'
          ? `${tierResult.tier === 'plus' ? 'Plus' : 'Automate'} subscription detected and activated!`
          : 'Account status verified - you\'re on the free plan'
      });
    }

  } catch (error) {
    console.error('❌ Error syncing tier:', error);
    return NextResponse.json({ 
      error: 'Failed to sync tier',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    return NextResponse.json({
      userId: clerkUser.id,
      publicMetadata: clerkUser.publicMetadata,
      privateMetadata: clerkUser.privateMetadata,
      externalAccounts: clerkUser.externalAccounts?.map(acc => ({ provider: acc.provider, id: acc.id })),
    });
  } catch (error) {
    console.error('❌ Error getting user data:', error);
    return NextResponse.json({ 
      error: 'Failed to get user data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
