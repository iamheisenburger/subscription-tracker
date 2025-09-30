import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { fetchMutation } from 'convex/nextjs';
import { api } from '../../../../../convex/_generated/api';

/**
 * Admin endpoint to manually sync premium users from Clerk dashboard
 * 
 * USE CASE: When webhooks fail and you need to bulk-fix users
 * 
 * USAGE:
 * 1. Go to Clerk dashboard → Users
 * 2. Find users with active subscriptions
 * 3. Copy their user IDs
 * 4. POST to this endpoint with:
 *    { "userIds": ["user_xxx", "user_yyy"], "adminSecret": "your-secret" }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userIds, adminSecret, subscriptionType = 'monthly' } = body;

    // Simple admin authentication
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ 
        error: 'userIds array required' 
      }, { status: 400 });
    }

    const results = {
      success: [] as string[],
      failed: [] as { userId: string; error: string }[],
      total: userIds.length
    };

    const client = await clerkClient();

    for (const userId of userIds) {
      try {
        // Update Clerk metadata with proper structure
        await client.users.updateUser(userId, {
          publicMetadata: {
            tier: 'premium_user',
            plan: 'premium_user', // Match Clerk plan key
            subscriptionType: subscriptionType,
            billing: subscriptionType,
            manually_synced_at: new Date().toISOString(),
            sync_reason: 'Admin bulk sync - webhook recovery',
            // Add all premium features
            features: {
              unlimited_subscriptions: true,
              smart_alerts: true,
              custom_categories: true,
              advanced_notifications: true,
              spending_trends: true,
              export_csv_pdf: true,
              priority_support: true
            }
          }
        });

        // Update Convex database
        await fetchMutation(api.users.setTier, {
          clerkId: userId,
          tier: 'premium_user',
          subscriptionType: subscriptionType as 'monthly' | 'annual'
        });

        results.success.push(userId);
        console.log(`✅ Synced user ${userId.slice(-8)} to premium`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.failed.push({ userId, error: errorMessage });
        console.error(`❌ Failed to sync user ${userId.slice(-8)}:`, errorMessage);
      }
    }

    return NextResponse.json({
      message: `Synced ${results.success.length}/${results.total} users`,
      results
    });

  } catch (error) {
    console.error('❌ Admin sync error:', error);
    return NextResponse.json({ 
      error: 'Sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check which users need syncing
 * Returns users who are marked as premium in your notes but free in the system
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminSecret = searchParams.get('adminSecret');

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // You would need to manually provide the list of users who should be premium
    return NextResponse.json({
      message: 'To use this endpoint, POST with userIds of premium subscribers from Clerk dashboard',
      example: {
        method: 'POST',
        body: {
          adminSecret: 'your-secret',
          userIds: ['user_xxx', 'user_yyy'],
          subscriptionType: 'annual' // or 'monthly'
        }
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
