import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';
import { detectTierFromClerkUser, logTierDetection, validateTierDetectionEnvironment } from '@/lib/tier-detection';

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Manual tier sync requested for user:', userId);

    // Validate environment
    const envCheck = validateTierDetectionEnvironment();
    if (!envCheck.valid) {
      console.error('❌ Environment validation failed:', envCheck.missing);
      return NextResponse.json({ 
        error: 'Configuration error',
        details: `Missing environment variables: ${envCheck.missing.join(', ')}`
      }, { status: 500 });
    }

    if (envCheck.warnings.length > 0) {
      console.warn('⚠️ Environment warnings:', envCheck.warnings);
    }

    // Get user from Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    
    // Use centralized tier detection
    const tierResult = detectTierFromClerkUser(clerkUser);
    logTierDetection(userId, tierResult, 'manual_sync');

    // Always update tier if we have medium or high confidence
    if (tierResult.confidence !== 'low') {
      await fetchMutation(api.users.setTier, {
        clerkId: userId,
        tier: tierResult.tier,
        subscriptionType: tierResult.subscriptionType,
      });

      return NextResponse.json({ 
        success: true, 
        tier: tierResult.tier,
        subscriptionType: tierResult.subscriptionType,
        confidence: tierResult.confidence,
        source: tierResult.source,
        message: `User synced to ${tierResult.tier} (${tierResult.confidence} confidence)`
      });
    } else {
      // Low confidence - don't make changes, just report
      return NextResponse.json({ 
        success: false, 
        tier: tierResult.tier,
        confidence: tierResult.confidence,
        source: tierResult.source,
        message: 'Low confidence in tier detection - no changes made',
        debug: process.env.NODE_ENV === 'development' ? tierResult.debug : undefined
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