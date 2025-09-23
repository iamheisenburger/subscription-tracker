import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { emailService } from '../../../../../lib/email';
import { api } from '../../../../../convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, subscriptionId, testEmail } = body;

    // For testing purposes, allow sending test emails
    if (testEmail && type === 'test') {
      const result = await emailService.testConnection();
      return NextResponse.json(result);
    }

    // Validate required fields
    if (!type || !subscriptionId) {
      return NextResponse.json({ 
        error: 'Missing required fields: type, subscriptionId' 
      }, { status: 400 });
    }

    // Get user data from Convex
    const user = await convex.query(api.users.getUserByClerkId, { clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get subscription data
    const subscriptions = await convex.query(api.subscriptions.getUserSubscriptions, { 
      clerkId: userId 
    });
    
    const subscription = subscriptions.find(sub => sub._id === subscriptionId);
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Prepare email data
    const userData = {
      email: user.email,
      firstName: user.email.split('@')[0], // Extract name from email as fallback
    };

    const subscriptionData = {
      name: subscription.name,
      cost: subscription.cost,
      currency: subscription.currency,
      billingCycle: subscription.billingCycle,
      nextBillingDate: subscription.nextBillingDate,
      category: subscription.category,
    };

    let emailResult;

    // Send appropriate email based on type
    switch (type) {
      case 'renewal_reminder':
        const daysUntil = body.daysUntil || 3;
        emailResult = await emailService.sendRenewalReminder(
          userData,
          subscriptionData,
          daysUntil
        );
        break;

      case 'price_change':
        const { oldPrice, newPrice } = body;
        if (!oldPrice || !newPrice) {
          return NextResponse.json({ 
            error: 'Price change requires oldPrice and newPrice' 
          }, { status: 400 });
        }
        emailResult = await emailService.sendPriceChangeAlert(
          userData,
          subscriptionData,
          oldPrice,
          newPrice
        );
        break;

      case 'spending_alert':
        const { currentSpending, threshold } = body;
        if (!currentSpending || !threshold) {
          return NextResponse.json({ 
            error: 'Spending alert requires currentSpending and threshold' 
          }, { status: 400 });
        }
        emailResult = await emailService.sendSpendingAlert(
          userData,
          currentSpending,
          threshold,
          subscription.currency
        );
        break;

      default:
        return NextResponse.json({ 
          error: `Unsupported email type: ${type}` 
        }, { status: 400 });
    }

    // Add to notification history if email was sent successfully
    if (emailResult.success) {
      await convex.mutation(api.notifications.addNotificationToHistory, {
        clerkId: userId,
        type,
        title: getNotificationTitle(type, subscription.name),
        message: getNotificationMessage(type, subscription.name, body),
        metadata: {
          subscriptionId,
          emailMessageId: emailResult.messageId,
        },
      });
    }

    return NextResponse.json(emailResult);

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Helper functions
function getNotificationTitle(type: string, subscriptionName: string): string {
  switch (type) {
    case 'renewal_reminder':
      return `Renewal reminder: ${subscriptionName}`;
    case 'price_change':
      return `Price change alert: ${subscriptionName}`;
    case 'spending_alert':
      return 'Monthly spending alert';
    default:
      return 'Notification';
  }
}

function getNotificationMessage(type: string, subscriptionName: string, data: Record<string, unknown>): string {
  switch (type) {
    case 'renewal_reminder':
      const days = (data.daysUntil as number) || 3;
      return `${subscriptionName} renews ${days === 1 ? 'tomorrow' : `in ${days} days`}`;
    case 'price_change':
      const oldPrice = data.oldPrice as number;
      const newPrice = data.newPrice as number;
      const direction = newPrice > oldPrice ? 'increased' : 'decreased';
      return `${subscriptionName} price ${direction} from $${oldPrice} to $${newPrice}`;
    case 'spending_alert':
      const currentSpending = data.currentSpending as number;
      const threshold = data.threshold as number;
      return `Current spending: $${currentSpending} (${Math.round((currentSpending / threshold) * 100)}% of budget)`;
    default:
      return 'You have a new notification';
  }
}
