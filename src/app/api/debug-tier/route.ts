import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { api } from '../../../../convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';
import { detectTierFromClerkUser } from '@/lib/tier-detection';
import { detectPremiumFromClerkBilling } from '@/lib/automatic-premium-detection';

/**
 * DEBUG API: Check user tier status across all systems
 * GET /api/debug-tier
 * 
 * This endpoint provides comprehensive debugging information about
 * why a user might be showing as free when they should be premium.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 DEBUG: Checking tier status for user:', userId.slice(-8));

    // 1. Get Clerk user data
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    
    // 2. Get Convex user data
    const convexUser = await fetchQuery(api.users.getUserByClerkId, { clerkId: userId });
    
    // 3. Run tier detection
    const tierDetection = detectTierFromClerkUser(clerkUser);
    
    // 4. Run premium detection
    const premiumDetection = await detectPremiumFromClerkBilling(userId);
    
    // 5. Environment check
    const envVars = {
      hasClerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
      hasConvexUrl: !!process.env.NEXT_PUBLIC_CONVEX_URL,
      hasPremiumPlanId: !!process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID,
      premiumPlanIdValue: process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID,
    };

    const debugData = {
      timestamp: new Date().toISOString(),
      userId: userId.slice(-8),
      
      // Clerk data
      clerk: {
        id: clerkUser.id,
        email: clerkUser.emailAddresses?.[0]?.emailAddress,
        createdAt: clerkUser.createdAt,
        publicMetadata: clerkUser.publicMetadata,
        privateMetadata: clerkUser.privateMetadata,
        externalAccounts: clerkUser.externalAccounts?.map(acc => ({
          provider: acc.provider,
          id: acc.id
        })),
        organizationMemberships: (clerkUser as any).organizationMemberships?.map((m: any) => ({
          slug: m.organization?.slug,
          name: m.organization?.name,
          role: m.role
        }))
      },
      
      // Convex data
      convex: {
        exists: !!convexUser,
        tier: convexUser?.tier,
        subscriptionType: convexUser?.subscriptionType,
        subscriptionLimit: convexUser?.subscriptionLimit,
        createdAt: convexUser?.createdAt,
        updatedAt: convexUser?.updatedAt,
        premiumExpiresAt: convexUser?.premiumExpiresAt,
        trialEndsAt: convexUser?.trialEndsAt,
      },
      
      // Detection results
      tierDetection: {
        tier: tierDetection.tier,
        subscriptionType: tierDetection.subscriptionType,
        confidence: tierDetection.confidence,
        source: tierDetection.source,
        debug: tierDetection.debug
      },
      
      premiumDetection: {
        isPremium: premiumDetection.isPremium,
        confidence: premiumDetection.confidence,
        source: premiumDetection.source,
        subscriptionType: premiumDetection.subscriptionType,
        details: premiumDetection.details
      },
      
      // Environment
      environment: envVars,
      
      // Analysis
      analysis: {
        clerkVsConvexTierMismatch: !!clerkUser.publicMetadata && 
          (clerkUser.publicMetadata as any)?.tier !== convexUser?.tier,
        shouldBePremium: tierDetection.tier === 'premium_user' || premiumDetection.isPremium,
        actualTier: convexUser?.tier || 'unknown',
        issueDetected: (tierDetection.tier === 'premium_user' || premiumDetection.isPremium) && 
          convexUser?.tier === 'free_user'
      }
    };

    // Add recommendations
    const recommendations = [];
    
    if (debugData.analysis.issueDetected) {
      recommendations.push('❌ ISSUE: User should be premium but shows as free');
      recommendations.push('🔧 FIX: Call POST /api/sync/tier to sync manually');
    }
    
    if (!envVars.hasPremiumPlanId) {
      recommendations.push('⚠️ WARNING: NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID not set');
    }
    
    if (tierDetection.confidence === 'low' && premiumDetection.confidence === 'low') {
      recommendations.push('ℹ️ INFO: Both detection methods show low confidence - user likely free');
    }
    
    if (!clerkUser.publicMetadata || Object.keys(clerkUser.publicMetadata).length === 0) {
      recommendations.push('⚠️ WARNING: Clerk user has no public metadata');
      recommendations.push('🔧 SUGGESTION: Check Clerk billing dashboard for subscription status');
    }

    return NextResponse.json({
      ...debugData,
      recommendations
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });

  } catch (error) {
    console.error('❌ Debug tier endpoint error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/debug-tier - Force sync tier
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 DEBUG: Force syncing tier for user:', userId.slice(-8));

    // Call the sync endpoint internally
    const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sync/tier`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userId}`, // This won't work with actual auth, but for debugging
        'Content-Type': 'application/json'
      }
    });

    const syncResult = await syncResponse.json();

    return NextResponse.json({
      action: 'force_sync',
      result: syncResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Debug tier force sync error:', error);
    return NextResponse.json({
      error: 'Force sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
