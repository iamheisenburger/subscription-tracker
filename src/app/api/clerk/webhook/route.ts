import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export const runtime = 'nodejs';

// Minimal webhook-like endpoint that trusts authenticated user session
// and accepts a tier to set. In production, use Clerk webhooks with signature verification.
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const body = await req.json();
    const tier = body?.tier;
    if (tier !== 'free_user' && tier !== 'premium_user') {
      return new NextResponse('Invalid tier', { status: 400 });
    }

    await fetchMutation(api.users.setTier, { clerkId: userId, tier });
    return new NextResponse('OK');
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }
}


