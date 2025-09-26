import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

/**
 * Debug endpoint to check webhook plan ID mismatch issues
 * GET /api/debug/webhook-check
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get environment variable
    const configuredPlanId = process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID;
    
    // Get user from Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    // Try to get the subscription information from Clerk (if available in metadata)
    const publicMeta = clerkUser.publicMetadata as any;
    const privateMeta = clerkUser.privateMetadata as any;

    const debugInfo = {
      userId: userId.slice(-8),
      timestamp: new Date().toISOString(),
      
      // Environment check
      environment: {
        planIdConfigured: !!configuredPlanId,
        planIdValue: configuredPlanId,
        planIdType: typeof configuredPlanId,
      },
      
      // User metadata
      clerkMetadata: {
        publicMetadata: publicMeta,
        privateMetadata: privateMeta,
        subscription_id: publicMeta?.subscription_id,
        plan_id_in_metadata: publicMeta?.plan_id,
      },
      
      // What the webhook would see
      webhookLogic: {
        wouldMatchPlan: publicMeta?.plan_id === configuredPlanId,
        comparison: {
          receivedPlanId: publicMeta?.plan_id,
          expectedPlanId: configuredPlanId,
          exactMatch: publicMeta?.plan_id === configuredPlanId,
        }
      },
      
      // Suggestions
      recommendations: []
    };

    // Add recommendations
    if (!configuredPlanId) {
      debugInfo.recommendations.push('❌ CRITICAL: NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID environment variable not set');
      debugInfo.recommendations.push('🔧 FIX: Set this variable to your Clerk premium plan ID');
    } else if (publicMeta?.plan_id && publicMeta.plan_id !== configuredPlanId) {
      debugInfo.recommendations.push('❌ PLAN ID MISMATCH: Webhook receives different plan ID than expected');
      debugInfo.recommendations.push(`🔧 FIX: Update NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID to "${publicMeta.plan_id}"`);
      debugInfo.recommendations.push('🔧 OR: Update Clerk plan to match your environment variable');
    } else if (!publicMeta?.plan_id) {
      debugInfo.recommendations.push('⚠️ No plan_id found in user metadata');
      debugInfo.recommendations.push('🔧 This is expected if user hasn\'t purchased premium yet');
    } else {
      debugInfo.recommendations.push('✅ Plan ID configuration looks correct');
    }

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('❌ Webhook debug check error:', error);
    return NextResponse.json({
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/debug/webhook-check
 * Test what would happen if a webhook was received with specific data
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { testPlanId } = body;

    const configuredPlanId = process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID;
    
    // Simulate webhook logic
    const webhookSimulation = {
      input: {
        testPlanId,
        configuredPlanId,
      },
      
      logic: {
        isPremiumPlan: testPlanId === configuredPlanId,
        wouldUpgradeUser: testPlanId === configuredPlanId,
      },
      
      result: testPlanId === configuredPlanId ? 
        'User would be upgraded to premium' : 
        'User would remain free (plan ID mismatch)'
    };

    return NextResponse.json({
      simulation: webhookSimulation,
      recommendation: testPlanId === configuredPlanId ?
        '✅ This plan ID would work correctly' :
        `❌ Plan ID mismatch - update NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID to "${testPlanId}"`
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Webhook simulation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
