import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { emailService } from '../../../../../lib/email';
import { api } from '../../../../../convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    const body = await request.json();
    const { type, subscriptionId } = body;

    // Allow internal Convex caller via INTERNAL token
    const authz = request.headers.get('authorization');
    const bearer = authz?.startsWith('Bearer ')
      ? authz.slice('Bearer '.length)
      : undefined;
    const isInternal = bearer && bearer === (process.env.INTERNAL_API_KEY || 'internal');

    const effectiveUserId = isInternal && body.clerkId ? body.clerkId : userId;
    if (!effectiveUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle test connection request
    if (type === 'test_connection') {
      console.log('Testing connection...');
      const result = await emailService.testConnection();
      console.log('Connection test result:', result);
      return NextResponse.json(result);
    }

    // For renewal/spending emails we require a subscriptionId; for simple test we do not
    if (!type) {
      return NextResponse.json({ error: 'Missing type' }, { status: 400 });
    }

    // Get user data from Convex
    const user = await convex.query(api.users.getUserByClerkId, { clerkId: effectiveUserId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get subscription data when provided
    let subscription: { _id: string; name: string; cost: number; currency: string; billingCycle: string; category?: string } | null = null;
    if (subscriptionId) {
      const subscriptions = await convex.query(api.subscriptions.getUserSubscriptions, { 
        clerkId: effectiveUserId 
      });
      subscription = subscriptions.find(sub => sub._id === subscriptionId) || subscriptions[0];
    }

    // Prepare email data
    const userData = {
      email: user.email,
      firstName: user.email.split('@')[0], // Extract name from email
      clerkId: effectiveUserId as string,
      preferredCurrency: user.preferredCurrency, // Pass user's preferred currency
    };

    const subscriptionData = subscription ? {
      name: subscription.name,
      cost: subscription.cost,
      currency: subscription.currency,
      billingCycle: subscription.billingCycle as "monthly" | "yearly" | "weekly",
      category: subscription.category,
    } : {
      name: "Test Subscription",
      cost: 9.99,
      currency: "USD",
      billingCycle: "monthly" as const,
      category: "Test",
    };

    let emailResult: { success: boolean; messageId?: string; error?: string };

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
          user.preferredCurrency || 'USD' // Use USER'S preferred currency, not subscription currency
        );
        break;

      default:
        // simple test email: use spending alert template trivially
        const testSpending = 50;
        const testThreshold = 100;
        emailResult = await emailService.sendSpendingAlert(
          userData,
          testSpending,
          testThreshold,
          'USD'
        );
        break;
    }

    // Add to notification history if email was sent successfully
    if (emailResult.success) {
      await convex.mutation(api.notifications.addNotificationToHistory, {
        clerkId: effectiveUserId,
        type,
        title: getNotificationTitle(type, subscription?.name || "Test Subscription"),
        message: getNotificationMessage(type, subscription?.name || "Test Subscription", body),
        metadata: {
          subscriptionId,
          emailMessageId: emailResult.messageId,
        },
      });
    }

    return NextResponse.json(emailResult);

  } catch (error) {
    console.error('=== EMAIL API ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error instanceof Error:', error instanceof Error);
    console.error('Error message:', error instanceof Error ? error.message : 'No message');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Full error object:', error);
    console.error('========================');
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: typeof error,
      stack: error instanceof Error ? error.stack : undefined
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
