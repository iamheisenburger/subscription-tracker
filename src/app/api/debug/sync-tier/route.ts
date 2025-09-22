import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export const runtime = 'nodejs';

export async function POST() {
  const session = await auth();
  const user = await currentUser();
  const userId = session.userId;
  
  if (!userId || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Debug: Log all the ways we could detect premium
    const debug = {
      userId,
      publicMetadata: user.publicMetadata,
      privateMetadata: user.privateMetadata,
      // organizationMemberships not available in currentUser(), check session instead
      sessionHas: {
        plan_premium_user: session.has?.({ plan: 'premium_user' }),
        plan_premium: session.has?.({ plan: 'premium' }),
        role_premium: session.has?.({ role: 'premium' })
      }
    };

    console.log('🔍 Debug sync tier:', debug);

    // Try multiple detection methods
    const metadata = user.publicMetadata as { plan?: string; tier?: string } | undefined;
    const hasPremiumMetadata = metadata?.plan === 'premium' || metadata?.tier === 'premium_user';
    
    // Check organization membership via session instead
    const hasPremiumOrg = false; // Will check via session.has instead

    const hasPremiumSession = session.has?.({ plan: 'premium_user' }) || session.has?.({ plan: 'premium' });

    const isPremium = hasPremiumMetadata || hasPremiumOrg || hasPremiumSession;

    // Force sync to Convex
    await fetchMutation(api.users.setTier, {
      clerkId: userId,
      tier: isPremium ? 'premium_user' : 'free_user',
    });

    return NextResponse.json({
      success: true,
      tier: isPremium ? 'premium_user' : 'free_user',
      debug,
      detectionMethods: {
        hasPremiumMetadata,
        hasPremiumOrg,
        hasPremiumSession,
        finalDecision: isPremium
      }
    });
  } catch (error) {
    console.error('Debug sync error:', error);
    return NextResponse.json({ 
      error: String(error),
      userId 
    }, { status: 500 });
  }
}
