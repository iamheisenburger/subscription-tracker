import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { detectActiveSubscriptionFromClerk } from '@/lib/clerk-billing-detection';

/**
 * DEEP DEBUG TOOL - Shows exactly why subscription detection is failing
 * GET /api/deep-debug
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔬 DEEP DEBUG - Starting comprehensive analysis for user:', userId.slice(-8));
    
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    // Raw Clerk user data
    const rawUserData = {
      id: clerkUser.id,
      publicMetadata: clerkUser.publicMetadata,
      privateMetadata: clerkUser.privateMetadata,
      externalAccounts: clerkUser.externalAccounts?.map(acc => ({
        provider: (acc as { provider: string }).provider,
        id: (acc as { id: string }).id,
        emailAddress: (acc as { emailAddress?: string }).emailAddress
      })) || [],
      organizationMemberships: (clerkUser as {
        organizationMemberships?: Array<{
          organization?: { slug?: string; name?: string; id?: string };
          role?: string;
          publicMetadata?: Record<string, unknown>;
        }>
      }).organizationMemberships?.map(membership => ({
        orgId: membership.organization?.id,
        orgSlug: membership.organization?.slug,
        orgName: membership.organization?.name,
        role: membership.role,
        publicMetadata: membership.publicMetadata
      })) || [],
      emailAddresses: (clerkUser as {
        emailAddresses?: Array<{ emailAddress?: string; id?: string }>
      }).emailAddresses?.map(email => email.emailAddress) || [],
      createdAt: clerkUser.createdAt
    };

    // Environment variables
    const environmentCheck = {
      NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID: process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID || 'NOT_SET',
      CLERK_SECRET_KEY_EXISTS: !!process.env.CLERK_SECRET_KEY,
      NODE_ENV: process.env.NODE_ENV
    };

    // Run our detection function
    const detectionResult = await detectActiveSubscriptionFromClerk(userId, client);

    // Manual analysis - why might detection fail?
    const analysisReasons: string[] = [];
    
    if (Object.keys(clerkUser.publicMetadata).length === 0) {
      analysisReasons.push('❌ Public metadata is completely empty (webhook failure confirmed)');
    }

    if (!clerkUser.externalAccounts || clerkUser.externalAccounts.length === 0) {
      analysisReasons.push('❌ No external accounts connected (no payment provider linkage)');
    } else {
      const paymentProviders = ['stripe', 'paypal', 'square', 'paddle'];
      const hasPaymentProvider = clerkUser.externalAccounts.some(acc =>
        paymentProviders.includes((acc as { provider: string }).provider.toLowerCase())
      );
      if (!hasPaymentProvider) {
        analysisReasons.push('❌ No payment provider in external accounts');
      }
    }

    const orgMemberships = (clerkUser as {
      organizationMemberships?: Array<{
        organization?: { slug?: string; name?: string };
        role?: string
      }>
    }).organizationMemberships;
    
    if (!orgMemberships || orgMemberships.length === 0) {
      analysisReasons.push('❌ No organization memberships');
    }

    if (!process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID) {
      analysisReasons.push('❌ NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID environment variable not set');
    }

    // Note: Clerk doesn't expose direct subscription API access
    const clerkSubscriptionCheck = {
      note: 'Clerk does not expose getUserSubscriptions API - subscription data must come from webhooks or metadata',
      alternativeCheck: 'We rely on publicMetadata, externalAccounts, or organization memberships'
    };

    const debugData = {
      timestamp: new Date().toISOString(),
      userId: userId.slice(-8) + '...',
      rawUserData,
      environmentCheck,
      detectionResult,
      analysisReasons,
      clerkSubscriptionCheck,
      recommendations: [
        detectionResult.hasActiveSubscription 
          ? '✅ Detection says you have subscription - check why metadata update failed'
          : '❌ Detection says no subscription - need to find why it\'s not detecting your paid plan',
        'Check if you can see your subscription in Clerk Dashboard',
        'Verify the plan ID matches what Clerk shows for your subscription',
        'Consider manual metadata update if subscription exists in Clerk'
      ]
    };

    return NextResponse.json(debugData, { 
      headers: { 'Content-Type': 'application/json' },
      status: 200 
    });

  } catch (error) {
    console.error('❌ Deep debug error:', error);
    return NextResponse.json({
      error: 'Deep debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
