import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export const runtime = 'nodejs';

// Temporary admin endpoint to set subscription type for testing
export async function POST(req: Request) {
  const session = await auth();
  const userId = session.userId;
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { subscriptionType } = body;
    
    if (!subscriptionType || !['monthly', 'annual'].includes(subscriptionType)) {
      return NextResponse.json({ error: 'Invalid subscription type' }, { status: 400 });
    }

    // Set the user as premium with the specified subscription type
    await fetchMutation(api.users.setTier, {
      clerkId: userId,
      tier: 'premium_user',
      subscriptionType: subscriptionType as 'monthly' | 'annual',
    });

    return NextResponse.json({
      success: true,
      tier: 'premium_user',
      subscriptionType,
      message: `Set to premium ${subscriptionType} for testing`
    });
  } catch (error) {
    console.error('Set subscription type error:', error);
    return NextResponse.json({ 
      error: String(error),
      userId 
    }, { status: 500 });
  }
}
