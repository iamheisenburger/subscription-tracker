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

    // Get user from Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    
    // Use centralized tier detection
    const tierResult = detectTierFromClerkUser(clerkUser);
    logTierDetection(userId, tierResult, 'manual_sync');

    // ENHANCED: Check for webhook failure if standard detection shows free
    if (tierResult.tier === 'free_user' && tierResult.confidence === 'high') {
      // Check if this might be a webhook failure case
      const hasEmptyMetadata = Object.keys(clerkUser.publicMetadata).length === 0;
      
      if (hasEmptyMetadata) {
        console.log('🔍 Empty metadata detected - checking for webhook failure');
        
        // Use universal subscription detection
        const subscriptionStatus = await detectActiveSubscriptionFromClerk(userId, client);
        
        if (subscriptionStatus.hasActiveSubscription && subscriptionStatus.confidence !== 'low') {
          console.log('✅ Webhook failure detected - active subscription found, fixing automatically');
          
          // Fix the webhook failure
          await client.users.updateUser(userId, {
            publicMetadata: {
              tier: 'premium_user',
              plan: 'premium',
              subscriptionType: subscriptionStatus.subscriptionType,
              billing: subscriptionStatus.subscriptionType,
              plan_id: subscriptionStatus.planId,
              subscription_status: 'active',
              auto_recovery_applied_at: new Date().toISOString(),
              auto_recovery_reason: 'Webhook failure auto-detected and fixed during sync'
            }
          });

          // Update Convex
          await fetchMutation(api.users.setTier, {
            clerkId: userId,
            tier: 'premium_user',
            subscriptionType: subscriptionStatus.subscriptionType,
          });

          return NextResponse.json({
            success: true,
            tier: 'premium_user',
            subscriptionType: subscriptionStatus.subscriptionType,
            confidence: 'high',
            source: 'webhook_failure_recovery',
            message: '🎉 Webhook failure detected and automatically fixed! You now have premium access.',
            recovery: {
              issue: 'Webhook failure - empty metadata despite active subscription',
              solution: 'Automatically restored premium status',
              details: subscriptionStatus
            }
          });
        }
      }
    }

    // Standard tier detection flow
    if (tierResult.confidence !== 'low') {
      // High/medium confidence - apply the detected tier
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
        message: tierResult.tier === 'premium_user' 
          ? 'Premium subscription detected and activated!'
          : 'Account status verified - you\'re on the free plan'
      });
    } else {
      // Low confidence - ensure user is at least marked correctly as free
      console.log('ℹ️ Low confidence detection - setting as free_user');
      
      await fetchMutation(api.users.setTier, {
        clerkId: userId,
        tier: 'free_user',
        subscriptionType: undefined,
      });

      return NextResponse.json({ 
        success: true, 
        tier: 'free_user',
        confidence: tierResult.confidence,
        source: tierResult.source,
        message: 'No premium subscription detected - confirmed free tier status'
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

// Also allow GET for debugging
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
      externalAccounts: clerkUser.externalAccounts?.map(acc => ({
        provider: acc.provider,
        id: acc.id,
      })),
    });

  } catch (error) {
    console.error('❌ Error getting user data:', error);
    return NextResponse.json({ 
      error: 'Failed to get user data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}