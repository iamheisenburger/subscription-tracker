import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { detectTierFromClerkUser } from '@/lib/tier-detection';
import { api } from '../../../../convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const convexUser = await fetchQuery(api.users.getUserByClerkId, { clerkId: userId });
    
    // Run the EXACT same tier detection that webhooks use
    const tierDetectionResult = detectTierFromClerkUser(clerkUser);
    
    return NextResponse.json({
      comparison: {
        clerkRawData: {
          id: clerkUser.id,
          publicMetadata: clerkUser.publicMetadata,
          privateMetadata: clerkUser.privateMetadata,
          externalAccounts: clerkUser.externalAccounts?.map(acc => ({
            provider: (acc as { provider: string }).provider,
            id: (acc as { id: string }).id
          }))
        },
        convexData: {
          tier: convexUser?.tier,
          subscriptionType: convexUser?.subscriptionType,
          subscriptionLimit: convexUser?.subscriptionLimit,
          updatedAt: convexUser?.updatedAt
        },
        tierDetectionResult,
        discrepancy: {
          clerkSaysActive: 'Check Clerk dashboard - you show as Active Premium',
          convexTier: convexUser?.tier || 'not found',
          tierDetectionTier: tierDetectionResult.tier,
          tierDetectionConfidence: tierDetectionResult.confidence,
          webhookWillUpdate: tierDetectionResult.confidence !== 'low' ? 'YES' : 'NO - THIS IS THE BUG'
        }
      }
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
