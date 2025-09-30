import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * Admin endpoint to list all users with active Clerk subscriptions
 * 
 * This helps identify which users need metadata syncing
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adminSecret } = body;

    // Verify admin secret
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    
    // Get all users
    const allUsers = await client.users.getUserList({ limit: 500 });
    
    // Filter for users who have subscriptions in Clerk
    // Since we can't query subscriptions directly, we check for users
    // who should be premium based on your Clerk dashboard
    const premiumUsers = allUsers.data.filter(user => {
      const metadata = user.publicMetadata as any;
      // Include users who:
      // 1. Have no metadata (likely webhook failed)
      // 2. Or have tier but it's free (to allow re-syncing)
      return true; // Return all for manual review
    });

    // Map to simpler format
    const userList = premiumUsers.map(user => ({
      id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      email_addresses: user.emailAddresses.map(e => ({ email_address: e.emailAddress })),
      public_metadata: user.publicMetadata,
      created_at: user.createdAt
    }));

    return NextResponse.json({
      success: true,
      count: userList.length,
      users: userList
    });

  } catch (error) {
    console.error('❌ List premium users error:', error);
    return NextResponse.json({ 
      error: 'Failed to list users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
