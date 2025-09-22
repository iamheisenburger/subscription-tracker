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
    const isPremium = session.has?.({ plan: 'premium_user' }) === true;
    await fetchMutation(api.users.setTier, {
      clerkId: userId,
      tier: isPremium ? 'premium_user' : 'free_user',
    });
    return NextResponse.json({ ok: true, tier: isPremium ? 'premium_user' : 'free_user' });
  } catch {
    return new NextResponse('Server error', { status: 500 });
  }
}


