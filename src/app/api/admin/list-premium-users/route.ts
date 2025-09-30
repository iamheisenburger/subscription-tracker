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
    
    // Return all users for manual review
    // Admin can decide which ones to sync
    const premiumUsers = allUsers.data;

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
