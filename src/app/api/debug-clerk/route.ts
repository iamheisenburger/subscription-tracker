import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

/**
 * Debug endpoint to see exactly what Clerk data we're getting
 * GET /api/debug-clerk
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    const debugData = {
      userId: userId.slice(-8),
      timestamp: new Date().toISOString(),
      
      // Raw Clerk data
      clerkData: {
        id: clerkUser.id,
        email: clerkUser.emailAddresses?.[0]?.emailAddress,
        createdAt: clerkUser.createdAt,
        publicMetadata: clerkUser.publicMetadata,
        privateMetadata: clerkUser.privateMetadata,
        externalAccounts: clerkUser.externalAccounts?.map(acc => ({
          provider: acc.provider,
          id: acc.id
        }))
      },
      
      // Environment variables (safe ones only)
      environment: {
        hasClerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
        hasConvexUrl: !!process.env.NEXT_PUBLIC_CONVEX_URL,
        hasPremiumPlanId: !!process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID,
        premiumPlanId: process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID || 'NOT_SET'
      },
      
      // What tier detection would see
      tierDetectionAnalysis: {
        publicMetadataTier: (clerkUser.publicMetadata as Record<string, unknown>)?.tier,
        publicMetadataPlan: (clerkUser.publicMetadata as Record<string, unknown>)?.plan,
        privateMetadataTier: (clerkUser.privateMetadata as Record<string, unknown>)?.tier,
        privateMetadataPlan: (clerkUser.privateMetadata as Record<string, unknown>)?.plan,
        hasExternalAccounts: clerkUser.externalAccounts && clerkUser.externalAccounts.length > 0,
        hasMetadata: Object.keys(clerkUser.publicMetadata).length > 0 || Object.keys(clerkUser.privateMetadata).length > 0
      }
    };

    return NextResponse.json(debugData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });

  } catch (error) {
    console.error('❌ Debug Clerk endpoint error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
