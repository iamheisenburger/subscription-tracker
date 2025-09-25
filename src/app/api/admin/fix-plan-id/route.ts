import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { fetchMutation } from 'convex/nextjs';
import { api } from '../../../../../convex/_generated/api';

/**
 * Emergency fix for users affected by wrong PLAN_ID environment variable
 * This manually upgrades users with the correct Clerk plan ID
 */
export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚨 EMERGENCY PLAN ID FIX for user:', userId.slice(-8));

    // Get user from Clerk to check subscription status
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    console.log('🔍 User metadata check:', {
      publicMetadata: clerkUser.publicMetadata,
      privateMetadata: clerkUser.privateMetadata
    });

    // Check if user has ANY premium-related metadata or external accounts indicating payment
    const hasPaymentAccount = clerkUser.externalAccounts?.some(
      account => ['stripe', 'paypal'].includes(account.provider)
    );

    const hasAnyPremiumIndicators = 
      // Check for any metadata that suggests premium
      JSON.stringify(clerkUser.publicMetadata).toLowerCase().includes('premium') ||
      JSON.stringify(clerkUser.privateMetadata).toLowerCase().includes('premium') ||
      hasPaymentAccount;

    if (hasAnyPremiumIndicators || process.env.NODE_ENV === 'development') {
      // Force upgrade the user - this is an emergency fix
      await fetchMutation(api.users.setTier, {
        clerkId: userId,
        tier: 'premium_user',
        subscriptionType: 'monthly', // Default, can be updated later
      });

      // Update Clerk metadata to reflect the fix
      await client.users.updateUser(userId, {
        publicMetadata: {
          ...clerkUser.publicMetadata,
          plan: 'premium',
          tier: 'premium_user',
          subscriptionType: 'monthly',
          emergency_fix_applied: new Date().toISOString(),
          fix_reason: 'wrong_plan_id_environment_variable',
          correct_plan_id: 'cplan_33D_oku0vc4d1',
          wrong_plan_id: 'cplan_32xfUNaavPmbOI3V7AtOq7EiPqM'
        }
      });

      console.log('✅ EMERGENCY FIX APPLIED - User upgraded to premium');

      return NextResponse.json({
        success: true,
        fixed: true,
        message: 'Emergency premium upgrade applied!',
        reason: 'Plan ID environment variable was incorrect',
        correctPlanId: 'cplan_33D_oku0vc4d1',
        wrongPlanId: 'cplan_32xfUNaavPmbOI3V7AtOq7EiPqM',
        userUpgraded: true,
        nextSteps: [
          'Update NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID in Vercel Environment Variables',
          'Set value to: cplan_33D_oku0vc4d1',
          'Redeploy the application',
          'This fix is temporary until environment variable is corrected'
        ]
      });
    } else {
      return NextResponse.json({
        success: true,
        fixed: false,
        message: 'No premium indicators found - manual verification needed',
        userMetadata: clerkUser.publicMetadata,
        recommendations: [
          'If you have an active subscription, use Force Premium Override',
          'Check your Clerk billing dashboard for active subscriptions',
          'Contact support if you believe this is an error'
        ]
      });
    }

  } catch (error) {
    console.error('❌ Emergency fix error:', error);
    return NextResponse.json({
      error: 'Emergency fix failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      solution: 'Update environment variable manually in Vercel Dashboard'
    }, { status: 500 });
  }
}
