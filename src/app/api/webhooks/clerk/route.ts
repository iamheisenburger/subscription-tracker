import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to your environment variables');
  }

  // Get the headers
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: { data: Record<string, unknown>; type: string };

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as { data: Record<string, unknown>; type: string };
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new NextResponse('Error occurred', {
      status: 400,
    });
  }

  const { data, type } = evt;

  // Debug logging to see what we're receiving
  console.log('🔍 Webhook received:', { type, userId: data.id, metadata: data.public_metadata });

  try {
    switch (type) {
      case 'user.created':
        await fetchMutation(api.users.createOrUpdateUser, {
          clerkId: data.id as string,
          email: (data.email_addresses as Array<{ email_address?: string }>)?.[0]?.email_address || "",
        });
        break;

      case 'user.updated':
        // Check if user has premium plan in public metadata
        const metadata = data.public_metadata as { 
          plan?: string; 
          tier?: string; 
          subscriptionType?: string;
          billing?: string;
        } | undefined;
        const hasPremiumMetadata = metadata?.plan === 'premium' || metadata?.tier === 'premium_user';
        
        if (hasPremiumMetadata) {
          // Determine subscription type from metadata
          let subscriptionType: "monthly" | "annual" | undefined;
          if (metadata?.subscriptionType === 'annual' || metadata?.billing === 'annual') {
            subscriptionType = 'annual';
          } else if (metadata?.subscriptionType === 'monthly' || metadata?.billing === 'monthly') {
            subscriptionType = 'monthly';
          }

          await fetchMutation(api.users.setTier, {
            clerkId: data.id as string,
            tier: 'premium_user',
            subscriptionType: subscriptionType,
          });
        }
        break;

      case 'organizationMembership.created':
        const orgData = data.organization as { slug?: string };
        const userData = data.public_user_data as { user_id?: string };
        const orgSlug = orgData?.slug;
        const userId = userData?.user_id;
        
        // If user joined premium organization, upgrade them
        if (orgSlug === 'premium' || orgSlug?.includes('premium')) {
          await fetchMutation(api.users.setTier, {
            clerkId: userId as string,
            tier: 'premium_user',
          });
        }
        break;

      case 'organizationMembership.deleted':
        const deletedUserData = data.public_user_data as { user_id?: string };
        const deletedUserId = deletedUserData?.user_id;
        
        if (deletedUserId) {
          await fetchMutation(api.users.setTier, {
            clerkId: deletedUserId,
            tier: 'free_user',
          });
        }
        break;

      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Error processing webhook', { status: 500 });
  }

  return NextResponse.json({ received: true });
}
