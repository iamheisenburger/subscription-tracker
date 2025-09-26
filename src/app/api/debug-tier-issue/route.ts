import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { api } from '../../../../convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';
import { detectTierFromClerkUser } from '@/lib/tier-detection';

/**
 * Comprehensive tier detection debugging endpoint
 * GET /api/debug-tier-issue
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 COMPREHENSIVE TIER DEBUG for user:', userId.slice(-8));

    // 1. Get Clerk user data
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    
    // 2. Get Convex user data
    let convexUser;
    try {
      convexUser = await fetchQuery(api.users.getUserByClerkId, { clerkId: userId });
    } catch (error) {
      console.error('Failed to get Convex user:', error);
      convexUser = null;
    }
    
    // 3. Run tier detection
    const tierDetection = detectTierFromClerkUser(clerkUser);
    
    // 4. Manual premium detection logic (what we expect to work)
    const manualDetection = {
      publicMetadata: clerkUser.publicMetadata,
      hasPublicTier: !!(clerkUser.publicMetadata as Record<string, unknown>)?.tier,
      hasPublicPlan: !!(clerkUser.publicMetadata as Record<string, unknown>)?.plan,
      tierValue: (clerkUser.publicMetadata as Record<string, unknown>)?.tier,
      planValue: (clerkUser.publicMetadata as Record<string, unknown>)?.plan,
      subscriptionId: (clerkUser.publicMetadata as Record<string, unknown>)?.subscription_id,
      planId: (clerkUser.publicMetadata as Record<string, unknown>)?.plan_id,
      
      // What SHOULD make them premium
      shouldBePremiumReasons: [] as string[]
    };
    
    // Analyze why they should be premium
    if (manualDetection.tierValue === 'premium_user') {
      manualDetection.shouldBePremiumReasons.push('Has tier=premium_user in publicMetadata');
    }
    if (manualDetection.planValue === 'premium') {
      manualDetection.shouldBePremiumReasons.push('Has plan=premium in publicMetadata');
    }
    if (manualDetection.subscriptionId) {
      manualDetection.shouldBePremiumReasons.push(`Has subscription_id: ${manualDetection.subscriptionId}`);
    }
    if (manualDetection.planId) {
      manualDetection.shouldBePremiumReasons.push(`Has plan_id: ${manualDetection.planId}`);
    }

    // 5. Environment check
    const environment = {
      hasClerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
      hasConvexUrl: !!process.env.NEXT_PUBLIC_CONVEX_URL,
      hasPremiumPlanId: !!process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID,
      premiumPlanIdValue: process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID || 'NOT_SET',
      planIdMatches: manualDetection.planId === process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID
    };

    const debugData = {
      timestamp: new Date().toISOString(),
      userId: userId.slice(-8),
      
      // Current state
      currentState: {
        convexExists: !!convexUser,
        convexTier: convexUser?.tier || 'NOT_FOUND',
        clerkHasMetadata: Object.keys(clerkUser.publicMetadata || {}).length > 0
      },
      
      // Clerk data (raw)
      clerkRawData: {
        publicMetadata: clerkUser.publicMetadata,
        privateMetadata: clerkUser.privateMetadata,
        externalAccounts: clerkUser.externalAccounts?.map(acc => ({
          provider: acc.provider,
          id: acc.id
        })),
        hasOrganizations: !!(clerkUser as { organizationMemberships?: unknown[] }).organizationMemberships?.length
      },
      
      // Tier detection result
      tierDetectionResult: tierDetection,
      
      // Manual analysis
      manualAnalysis: manualDetection,
      
      // Environment
      environment,
      
      // What's the problem?
      problemAnalysis: {
        issues: [] as string[],
        recommendations: [] as string[]
      }
    };

    // Analyze issues
    if (!convexUser) {
      debugData.problemAnalysis.issues.push('❌ User not found in Convex database');
      debugData.problemAnalysis.recommendations.push('🔧 Run user creation webhook or manual sync');
    }
    
    if (!Object.keys(clerkUser.publicMetadata || {}).length) {
      debugData.problemAnalysis.issues.push('❌ No public metadata in Clerk user');
      debugData.problemAnalysis.recommendations.push('🔧 Metadata missing - webhook never ran or failed');
    }
    
    if (!environment.hasPremiumPlanId) {
      debugData.problemAnalysis.issues.push('❌ NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID not set');
      debugData.problemAnalysis.recommendations.push('🔧 Set environment variable to: cplan_32xfUNaavPmbOI3V7AtOq7EiPqM');
    }
    
    if (tierDetection.tier === 'free_user' && manualDetection.shouldBePremiumReasons.length > 0) {
      debugData.problemAnalysis.issues.push('❌ Tier detection failed despite premium indicators');
      debugData.problemAnalysis.recommendations.push('🔧 Check tier detection logic - user has premium metadata but detected as free');
    }
    
    if (tierDetection.confidence === 'low') {
      debugData.problemAnalysis.issues.push('⚠️ Tier detection has low confidence');
      debugData.problemAnalysis.recommendations.push('🔧 User needs manual tier assignment or metadata correction');
    }

    return NextResponse.json(debugData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });

  } catch (error) {
    console.error('❌ Debug tier issue endpoint error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/debug-tier-issue - Force fix the user's tier
 */
export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔧 FORCE FIXING tier for user:', userId.slice(-8));

    // Get Clerk user
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    
    // Manual premium detection based on your specific case
    const metadata = clerkUser.publicMetadata as Record<string, unknown>;
    let shouldBePremium = false;
    let reason = '';

    // Check multiple indicators
    if (metadata?.tier === 'premium_user') {
      shouldBePremium = true;
      reason = 'Has tier=premium_user in metadata';
    } else if (metadata?.plan === 'premium') {
      shouldBePremium = true;
      reason = 'Has plan=premium in metadata';
    } else if (metadata?.subscription_id || metadata?.plan_id) {
      shouldBePremium = true;
      reason = 'Has subscription/plan ID in metadata';
    } else if (clerkUser.externalAccounts?.some(acc => acc.provider === 'stripe')) {
      shouldBePremium = true;
      reason = 'Connected to Stripe (payment provider)';
    }

    if (shouldBePremium) {
      // Force upgrade to premium
      await fetchMutation(api.users.setTier, {
        clerkId: userId,
        tier: 'premium_user',
        subscriptionType: 'monthly', // Default
      });

      // Update Clerk metadata to be consistent
      await client.users.updateUser(userId, {
        publicMetadata: {
          ...clerkUser.publicMetadata,
          tier: 'premium_user',
          plan: 'premium',
          force_upgraded_at: new Date().toISOString(),
          force_upgrade_reason: reason
        }
      });

      return NextResponse.json({
        success: true,
        action: 'force_upgraded',
        tier: 'premium_user',
        reason,
        message: 'Successfully force-upgraded to premium!'
      });
    } else {
      return NextResponse.json({
        success: false,
        action: 'no_change',
        tier: 'free_user',
        reason: 'No premium indicators found',
        message: 'No evidence of premium subscription found'
      });
    }

  } catch (error) {
    console.error('❌ Force tier fix error:', error);
    return NextResponse.json({
      error: 'Force fix failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
