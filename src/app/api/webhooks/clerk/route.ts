import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const headersList = await headers();
  const svixId = headersList.get('svix-id');
  const svixTimestamp = headersList.get('svix-timestamp');
  const svixSignature = headersList.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse('Missing headers', { status: 400 });
  }

  const payload = await req.json();
  const { type, data } = payload;

  // Handle subscription events
  if (type === 'subscription.created' || type === 'subscription.updated') {
    const userId = data.user_id;
    const planName = data.plan_name || data.plan?.name;
    
    if (userId) {
      const tier = planName === 'premium' || planName === 'Premium' ? 'premium_user' : 'free_user';
      
      try {
        await fetchMutation(api.users.setTier, {
          clerkId: userId,
          tier,
        });
      } catch (error) {
        console.error('Failed to update user tier:', error);
      }
    }
  }

  // Handle subscription cancellation
  if (type === 'subscription.deleted') {
    const userId = data.user_id;
    
    if (userId) {
      try {
        await fetchMutation(api.users.setTier, {
          clerkId: userId,
          tier: 'free_user',
        });
      } catch (error) {
        console.error('Failed to downgrade user tier:', error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
