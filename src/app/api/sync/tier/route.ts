import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export const runtime = 'nodejs';

export async function POST() {
  const session = await auth();
  const userId = session.userId;
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  try {
    // Check multiple ways Clerk might expose premium status
    const isPremium = 
      session.has?.({ plan: 'premium_user' }) === true ||
      session.has?.({ plan: 'premium' }) === true;
    
    await fetchMutation(api.users.setTier, {
      clerkId: userId,
      tier: isPremium ? 'premium_user' : 'free_user',
    });
    
    return NextResponse.json({ 
      ok: true, 
      tier: isPremium ? 'premium_user' : 'free_user',
      debug: {
        hasPremiumUser: session.has?.({ plan: 'premium_user' }),
        hasPremium: session.has?.({ plan: 'premium' })
      }
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}


