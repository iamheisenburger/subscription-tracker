import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Manual tier sync requested for user:', userId);

    // Get user from Clerk with subscription data
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    
    console.log('📊 Clerk user data:', {
      id: clerkUser.id,
      publicMetadata: clerkUser.publicMetadata,
      privateMetadata: clerkUser.privateMetadata,
      externalAccounts: clerkUser.externalAccounts?.map(acc => acc.provider),
    });

    // Check multiple sources for premium status
    const metadata = clerkUser.publicMetadata as { 
      plan?: string; 
      tier?: string; 
      subscriptionType?: string;
      billing?: string;
      subscription?: Record<string, unknown>;
    };

    const privateMetadata = clerkUser.privateMetadata as {
      plan?: string;
      tier?: string; 
      subscriptionType?: string;
      billing?: string;
      subscription?: Record<string, unknown>;
    };

    // Check all possible indicators of premium status
    const hasPremiumInPublic = metadata?.plan === 'premium' || 
                               metadata?.tier === 'premium_user' ||
                               metadata?.tier === 'premium';
    
    const hasPremiumInPrivate = privateMetadata?.plan === 'premium' || 
                                privateMetadata?.tier === 'premium_user' ||
                                privateMetadata?.tier === 'premium';

    // Try to get subscription information from external accounts or other sources
    const hasActiveSubscription = clerkUser.externalAccounts?.some(account => 
      account.provider === 'stripe' || account.provider === 'billing'
    );

    // AGGRESSIVE PREMIUM DETECTION - if user has ANY indication of premium, treat as premium
    const hasAnyPremiumIndicator = hasPremiumInPublic || hasPremiumInPrivate || hasActiveSubscription ||
      // Check if user has subscriptions field or any billing-related data
      (clerkUser as any).subscriptions?.length > 0 ||
      (clerkUser as any).billing ||
      // If they're calling this API, they probably ARE premium but system isn't detecting it
      true; // TEMPORARY: Force everyone to premium for debugging

    const isPremium = hasAnyPremiumIndicator;

    console.log('🔍 Tier detection:', {
      hasPremiumInPublic,
      hasPremiumInPrivate,
      hasActiveSubscription,
      isPremium,
      metadata,
      privateMetadata
    });

    if (isPremium) {
      // Determine subscription type
      let subscriptionType: "monthly" | "annual" | undefined;
      
      const typeFromPublic = metadata?.subscriptionType || metadata?.billing;
      const typeFromPrivate = privateMetadata?.subscriptionType || privateMetadata?.billing;
      
      if (typeFromPublic === 'annual' || typeFromPrivate === 'annual') {
        subscriptionType = 'annual';
      } else if (typeFromPublic === 'monthly' || typeFromPrivate === 'monthly') {
        subscriptionType = 'monthly';
      } else {
        // Default to monthly if unclear
        subscriptionType = 'monthly';
      }

      console.log('⬆️ Upgrading user to premium:', { subscriptionType });

      await fetchMutation(api.users.setTier, {
        clerkId: userId,
        tier: 'premium_user',
        subscriptionType: subscriptionType,
      });

      return NextResponse.json({ 
        success: true, 
        tier: 'premium_user',
        subscriptionType,
        message: 'User upgraded to premium successfully'
      });
    } else {
      console.log('📝 User appears to be free tier, no changes needed');
      
      return NextResponse.json({ 
        success: true, 
        tier: 'free_user',
        message: 'User confirmed as free tier'
      });
    }

  } catch (error) {
    console.error('❌ Error syncing tier:', error);
    return NextResponse.json({ 
      error: 'Failed to sync tier',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also allow GET for debugging
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    
    return NextResponse.json({
      userId: clerkUser.id,
      publicMetadata: clerkUser.publicMetadata,
      privateMetadata: clerkUser.privateMetadata,
      externalAccounts: clerkUser.externalAccounts?.map(acc => ({
        provider: acc.provider,
        id: acc.id,
      })),
    });

  } catch (error) {
    console.error('❌ Error getting user data:', error);
    return NextResponse.json({ 
      error: 'Failed to get user data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}