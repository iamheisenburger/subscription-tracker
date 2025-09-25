import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * Debug endpoint to check webhook configuration and recent events
 * This helps diagnose why subscription events aren't upgrading users to premium
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check environment variables
    const envConfig = {
      clerkPremiumPlanId: process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID || 'NOT_SET',
      clerkWebhookSecret: process.env.CLERK_WEBHOOK_SECRET ? 'SET' : 'NOT_SET',
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV || 'local'
    };

    // Check webhook endpoint URL
    const webhookUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/webhooks/clerk`
      : 'https://usesubwise.app/api/webhooks/clerk';

    return NextResponse.json({
      userId: userId.slice(-8),
      environment: envConfig,
      webhookEndpoint: webhookUrl,
      expectedEvents: [
        'subscription.created',
        'subscription.active', 
        'subscription.updated',
        'subscriptionItem.active',
        'subscriptionItem.created'
      ],
      troubleshooting: {
        commonIssues: [
          'NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID not matching actual plan ID from Clerk',
          'Webhook receiving events but plan_id field not matching our environment variable',
          'Subscription events not containing expected user_id field',
          'Events being received but not for the right subscription type'
        ],
        solutions: [
          'Check Clerk Dashboard → Plans → Premium → copy the exact Plan ID',
          'Verify webhook URL is exactly: ' + webhookUrl,
          'Check webhook logs in Clerk Dashboard for specific subscription events',
          'Verify subscription.created events contain your user_id'
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Webhook debug error:', error);
    return NextResponse.json({
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST endpoint to manually log and debug webhook event structure
 * This can be called by webhook to see what data is actually being received
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType, data, userId: debugUserId } = body;
    
    console.log('🔍 DEBUG WEBHOOK EVENT:', {
      eventType,
      timestamp: new Date().toISOString(),
      userId: debugUserId,
      dataKeys: Object.keys(data || {}),
      fullData: data
    });

    // Check if this looks like a subscription event
    if (eventType?.startsWith('subscription')) {
      const subscriptionData = data as {
        id?: string;
        user_id?: string;
        status?: string; 
        plan_id?: string;
        interval?: string;
      };

      console.log('📋 SUBSCRIPTION EVENT DETAILS:', {
        subscriptionId: subscriptionData.id,
        userId: subscriptionData.user_id,
        status: subscriptionData.status,
        planId: subscriptionData.plan_id,
        interval: subscriptionData.interval,
        expectedPlanId: process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID,
        planIdMatches: subscriptionData.plan_id === process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Debug event logged',
      eventType,
      dataReceived: !!data
    });

  } catch (error) {
    console.error('❌ Debug webhook POST error:', error);
    return NextResponse.json({
      error: 'Debug logging failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
