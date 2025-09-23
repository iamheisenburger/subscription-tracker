import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { internal } from '../../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    // Only allow in development or with proper authorization
    if (process.env.NODE_ENV === 'production') {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { action } = body;

    let result;

    switch (action) {
      case 'generate_renewal_reminders':
        result = await convex.action(internal.notifications.generateRenewalReminders);
        break;

      case 'process_notification_queue':
        result = await convex.action(internal.notifications.processNotificationQueue);
        break;

      case 'check_spending_thresholds':
        result = await convex.action(internal.notifications.checkSpendingThresholds);
        break;

      case 'cleanup_old_notifications':
        result = await convex.action(internal.notifications.cleanupOldNotifications);
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Available actions: generate_renewal_reminders, process_notification_queue, check_spending_thresholds, cleanup_old_notifications' 
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Cron test API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// GET endpoint to show available actions
export async function GET() {
  return NextResponse.json({
    message: 'Notification System Test API',
    availableActions: [
      {
        action: 'generate_renewal_reminders',
        description: 'Generate renewal reminders for all users based on their notification preferences',
        method: 'POST',
        body: { action: 'generate_renewal_reminders' }
      },
      {
        action: 'process_notification_queue',
        description: 'Process pending notifications in the queue and send emails',
        method: 'POST',
        body: { action: 'process_notification_queue' }
      },
      {
        action: 'check_spending_thresholds',
        description: 'Check spending thresholds for premium users and generate alerts',
        method: 'POST',
        body: { action: 'check_spending_thresholds' }
      },
      {
        action: 'cleanup_old_notifications',
        description: 'Clean up old notification queue items and history',
        method: 'POST',
        body: { action: 'cleanup_old_notifications' }
      }
    ],
    environment: process.env.NODE_ENV,
    note: process.env.NODE_ENV === 'production' 
      ? 'Authentication required in production' 
      : 'No authentication required in development'
  });
}
