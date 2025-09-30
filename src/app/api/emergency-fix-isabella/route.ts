import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { api } from '../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

/**
 * EMERGENCY FIX FOR ISABELLA'S ACCOUNT
 * Direct fix based on known premium status from Clerk dashboard
 */
export async function GET() {
  try {
    // Isabella's user ID from debug data
    const userId = 'user_33DUJSa77whvtapyYPh2bPGX0Ot';
    
    console.log('🚨 EMERGENCY FIX for Isabella');
    
    const client = await clerkClient();
    
    // Step 1: Force premium metadata in Clerk
    await client.users.updateUser(userId, {
      publicMetadata: {
        tier: 'premium_user',
        plan: 'premium',
        subscriptionType: 'annual',
        billing: 'annual',
        subscription_status: 'active',
        plan_id: 'cplan_32xfUNaavPmbOI3V7AtOq7EiPqM',
        emergency_fix: new Date().toISOString(),
        fix_reason: 'Manual fix - Clerk shows premium but app shows free'
      }
    });

    // Step 2: Force premium in Convex
    await fetchMutation(api.users.setTier, {
      clerkId: userId,
      tier: 'premium_user',
      subscriptionType: 'annual',
    });

    console.log('✅ EMERGENCY FIX COMPLETE');

    return NextResponse.json({
      success: true,
      message: 'Isabella account fixed - refresh dashboard now',
      action: 'emergency_premium_restoration',
      next_step: 'Refresh https://usesubwise.app/dashboard'
    });

  } catch (error) {
    console.error('❌ Emergency fix failed:', error);
    return NextResponse.json({
      error: 'Emergency fix failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

